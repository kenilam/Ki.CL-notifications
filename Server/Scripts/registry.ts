/**
 * Keeps this service's record in the schema registry, the bucket the gateway
 * builds the supergraph from. Each service owns one record,
 * `services/<name>.json`: its name, its URL, its schema, the path the host
 * mounts it at for a service with a page, and the path of its JWKS for the
 * service that signs access tokens.
 *
 * Run:
 *   npx tsx Server/Scripts/registry.ts record <url>
 *   npx tsx Server/Scripts/registry.ts check <bucket>
 *   npx tsx Server/Scripts/registry.ts publish <bucket> <url>
 *
 * record: prints the record for a service at <url>, for a local registry.
 *
 * check: composes this schema with every other published record, and fails
 * on a composition error or a root field without the service's prefix. Cloud
 * Build runs it before deploying.
 *
 * publish: writes this service's record. Cloud Build runs it after the deploy
 * succeeds, and the gateway picks it up on its next poll.
 */
import { readFileSync } from 'node:fs';

import { Storage } from '@google-cloud/storage';
import { composeServices } from '@theguild/federation-composition';
import { parse, print, type ObjectTypeDefinitionNode, type ObjectTypeExtensionNode } from 'graphql';

const NAME = 'notifications';
const PREFIX = 'notifications';
const MOUNT: string | undefined = undefined;
const JWKS: string | undefined = undefined;

const typeDefs = parse(readFileSync(new URL('../schema.graphql', import.meta.url), 'utf8'));

const USAGE = 'Usage: registry.ts record <url> | check <bucket> | publish <bucket> <url>';
const FOLDER = 'services/';
const ROOT_TYPES = ['Query', 'Mutation', 'Subscription'];

interface ServiceRecord {
  name: string;
  url: string;
  sdl: string;
  mount?: string;
  jwks?: string;
}

const LINKS = `extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.7", import: ["@composeDirective"])
  @link(url: "https://ki-cl.com/auth/v1.0", import: ["@public"])
  @composeDirective(name: "@public")`;

const sdl = `${LINKS}\n\n${print(typeDefs)}`;

function record(url: string): ServiceRecord {
  return { name: NAME, url, sdl, ...(MOUNT ? { mount: MOUNT } : {}), ...(JWKS ? { jwks: JWKS } : {}) };
}

function unprefixedRootFields(): string[] {
  if (!PREFIX) {
    return [];
  }

  return typeDefs.definitions
    .filter(
      (definition): definition is ObjectTypeDefinitionNode | ObjectTypeExtensionNode =>
        (definition.kind === 'ObjectTypeDefinition' || definition.kind === 'ObjectTypeExtension') &&
        ROOT_TYPES.includes(definition.name.value),
    )
    .flatMap((definition) =>
      (definition.fields ?? [])
        .map((field) => field.name.value)
        .filter((field) => !field.startsWith(PREFIX))
        .map((field) => `${definition.name.value}.${field}`),
    );
}

async function publishedRecords(bucket: string): Promise<ServiceRecord[]> {
  const [files] = await new Storage().bucket(bucket).getFiles({ prefix: FOLDER });
  const records = await Promise.all(
    files
      .filter((file) => file.name.endsWith('.json'))
      .map(async (file) => JSON.parse((await file.download())[0].toString('utf8')) as ServiceRecord),
  );

  return records.filter((record) => record.name !== NAME);
}

async function check(bucket: string): Promise<void> {
  const unprefixed = unprefixedRootFields();

  if (unprefixed.length) {
    throw new Error(`Root fields without the "${PREFIX}" prefix: ${unprefixed.join(', ')}`);
  }

  const others = await publishedRecords(bucket);
  const result = composeServices(
    [...others, { name: NAME, url: `https://${NAME}.invalid/graphql`, sdl }].map((record) => ({
      name: record.name,
      url: record.url,
      typeDefs: parse(record.sdl),
    })),
  );

  if (result.errors?.length) {
    throw new Error(`Composition failed:\n${result.errors.map((error) => `- ${error.message}`).join('\n')}`);
  }

  console.log(`${NAME} composes with ${others.map((record) => record.name).join(', ') || 'no other service'}.`);
}

async function publish(bucket: string, url: string): Promise<void> {
  await new Storage()
    .bucket(bucket)
    .file(`${FOLDER}${NAME}.json`)
    .save(JSON.stringify(record(url), null, 2), { contentType: 'application/json' });

  console.log(`Published ${NAME} at ${url} to gs://${bucket}/${FOLDER}${NAME}.json.`);
}

const [command, ...args] = process.argv.slice(2);
const [bucket, url] = args;

if (command === 'record' && args[0]) {
  console.log(JSON.stringify(record(args[0]), null, 2));
} else if (command === 'check' && bucket) {
  await check(bucket);
} else if (command === 'publish' && bucket && url) {
  await publish(bucket, url);
} else {
  throw new Error(USAGE);
}
