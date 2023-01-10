import { id as subdirId } from './subdir';
import { id as libId } from '@e2e/lib';
import bId from "@aspect-test/b"

export const id = () => `wrapper-lib: ${subdirId()} + ${libId()} + ${bId()}`;
