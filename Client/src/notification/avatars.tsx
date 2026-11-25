import React from 'react';

// Components
import { Spinner } from 'design/components';

// Icons
import * as Tb from 'react-icons/tb';

import type { Level } from './documents';

/** Work still running shows a spinner; anything else shows its level's icon. */
const RUNNING = <Spinner position='inline' />;

const AVATARS: Record<Level, React.ReactNode> = {
  CONFIRM: <Tb.TbCircleCheck />,
  ERROR: <Tb.TbAlertCircle />,
  INFO: <Tb.TbInfoCircle />,
  NEUTRAL: <Tb.TbBell />,
  WARNING: <Tb.TbAlertTriangle />,
};

export { AVATARS, RUNNING };
