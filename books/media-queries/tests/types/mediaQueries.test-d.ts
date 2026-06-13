import type {
  IMeasurement,
  IRatio,
} from '@css-bookends/css-calipers';
import { mPx, r } from '@css-bookends/css-calipers';
import {
  expectAssignable,
  expectNotAssignable,
  expectType,
} from 'tsd';

import type {
  IMediaQueryProps,
  MediaQueryModulePropsMap,
} from '../../dist/esm';
import {
  buildMediaQueryFromFeatures,
  buildMediaQueryString,
  createMediaQueryBuilder,
  defineMediaQueryModules,
  emitDimensionsFeatures,
  mediaQueryFactory,
} from '../../dist/esm';

const width = mPx(640);
expectAssignable<IMeasurement<'px'>>(width);

const query = buildMediaQueryString({
  minWidth: width,
  maxWidth: mPx(1200),
  orientation: 'landscape',
});
expectType<string>(query);

const customQuery = buildMediaQueryFromFeatures({
  'min-width': width,
  'custom-level': 2,
});
expectType<string>(customQuery);

const builder = createMediaQueryBuilder({
  emitBase: emitDimensionsFeatures,
  config: {
    errorHandling: {
      invalidValueMode: 'log',
      lintingMode: 'allow',
    },
  },
});

expectType<string>(builder({ width }));

const coreModules = defineMediaQueryModules('core');
type CoreProps =
  MediaQueryModulePropsMap[(typeof coreModules)[number]];
expectNotAssignable<CoreProps>({ minWidth: width, hover: 'hover' });
const coreFactory = mediaQueryFactory({
  queries: {
    onlyCore: {
      minWidth: width,
    },
  } as Record<string, CoreProps>,
  config: {
    label: 'core-only',
    modules: coreModules,
  },
});
expectAssignable<unknown>(coreFactory);

const customModules = defineMediaQueryModules('custom');
type CustomProps =
  MediaQueryModulePropsMap[(typeof customModules)[number]];
expectAssignable<CustomProps>({
  customFeatures: { 'custom-flag': 'on' },
});
expectNotAssignable<CustomProps>({ hover: 'hover' });
const customAllowedFactory = mediaQueryFactory({
  queries: {
    customOk: {
      customFeatures: { 'custom-flag': 'on' },
    },
  } as Record<string, CustomProps>,
  config: {
    label: 'custom-ok',
    modules: customModules,
  },
});
expectAssignable<unknown>(customAllowedFactory);

expectAssignable<IRatio>(r(16, 9));
expectAssignable<IMediaQueryProps>({ aspectRatio: r(16, 9) });
expectAssignable<IMediaQueryProps>({ minAspectRatio: r(4, 3) });
expectAssignable<IMediaQueryProps>({ maxAspectRatio: r(21, 9) });
