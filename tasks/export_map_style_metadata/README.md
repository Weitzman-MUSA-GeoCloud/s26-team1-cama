# Export Map Style Metadata

This HTTP Cloud Function exports map styling metadata for the reviewer vector
tile map. The frontend uses the metadata to build legends and default styling
for numeric property tile fields that are not easy to summarize directly from
vector tiles in the browser.

## Frontend Contract

Vector tile URL pattern:

```text
https://storage.googleapis.com/musa5090s26-team1-public/tiles/properties/{z}/{x}/{y}.pbf
```

Vector tile source layer:

```text
property_tile_info
```

Default style field:

```text
current_assessed_value
```

The metadata includes these fields:

- `current_assessed_value`
- `tax_year_assessed_value`
- `absolute_change`
- `percent_change`

Each field includes:

- `label`
- `min`
- `max`
- `quantile_breakpoints`
- `fixed_breakpoints`

## Output

GCS path:

```text
gs://musa5090s26-team1-public/configs/map_style_metadata.json
```

Public URL:

```text
https://storage.googleapis.com/musa5090s26-team1-public/configs/map_style_metadata.json
```

## Environment Variables

All environment variables have defaults:

- `PROJECT_ID`, default `musa5090s26-team1`
- `BQ_CORE_DATASET`, default `core`
- `BQ_DERIVED_DATASET`, default `derived`
- `PUBLIC_BUCKET`, default `musa5090s26-team1-public`
- `OUTPUT_BLOB`, default `configs/map_style_metadata.json`

## Deploy

```bash
gcloud functions deploy export-map-style-metadata \
  --gen2 \
  --runtime=python312 \
  --region=us-east4 \
  --source=tasks/export_map_style_metadata \
  --entry-point=export_map_style_metadata \
  --trigger-http \
  --no-allow-unauthenticated \
  --set-env-vars PROJECT_ID=musa5090s26-team1,BQ_CORE_DATASET=core,BQ_DERIVED_DATASET=derived,PUBLIC_BUCKET=musa5090s26-team1-public,OUTPUT_BLOB=configs/map_style_metadata.json
```

## Test

```bash
functions-framework \
  --target export_map_style_metadata \
  --source tasks/export_map_style_metadata/main.py \
  --port 8080
```

In another terminal:

```bash
curl -X POST http://localhost:8080/
```

To test the deployed authenticated function:

```bash
URL=$(gcloud functions describe export-map-style-metadata \
  --gen2 \
  --region=us-east4 \
  --format="value(serviceConfig.uri)")

TOKEN=$(gcloud auth print-identity-token --audiences="$URL")

curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  "${URL}"
```

## Verify

```bash
gcloud storage ls gs://musa5090s26-team1-public/configs/map_style_metadata.json
gcloud storage cat gs://musa5090s26-team1-public/configs/map_style_metadata.json
```

Workflow integration will be handled later.
