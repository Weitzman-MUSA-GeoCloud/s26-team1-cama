#!/usr/bin/env bash
set -euo pipefail

TEMP_BUCKET="${TEMP_BUCKET:-musa5090s26-team1-temp_data}"
PUBLIC_BUCKET="${PUBLIC_BUCKET:-musa5090s26-team1-public}"

INPUT_URI="gs://${TEMP_BUCKET}/property_tile_info.geojson"
OUTPUT_URI="gs://${PUBLIC_BUCKET}/tiles"

WORK_DIR="/tmp/property-map-tiles"
INPUT_FILE="${WORK_DIR}/property_tile_info.geojson"
OUTPUT_DIR="${WORK_DIR}/properties"

rm -rf "${WORK_DIR}"
mkdir -p "${WORK_DIR}"

gcloud storage cp "${INPUT_URI}" "${INPUT_FILE}"

ogr2ogr \
    -f MVT \
    "${OUTPUT_DIR}" \
    "${INPUT_FILE}" \
    -nln property_tile_info \
    -dsco MINZOOM=12 \
    -dsco MAXZOOM=18 \
    -dsco COMPRESS=NO

gcloud storage rm -r "${OUTPUT_URI}/properties" || true
gcloud storage cp -r "${OUTPUT_DIR}" "${OUTPUT_URI}/"
