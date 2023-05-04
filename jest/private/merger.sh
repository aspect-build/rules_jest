#!/usr/bin/env sh


# When --experimental_split_coverage_postprocessing is enabled copy the
# $COVERAGE_DIR/coverage.dat to final destination that is $COVERAGE_OUTPUT_FILE
if [ $SPLIT_COVERAGE_POST_PROCESSING == 1 ]; then
    cp "${COVERAGE_DIR}/coverage.dat" "${COVERAGE_OUTPUT_FILE}"
fi

exit 0
