# Property Assessment Lookup

HTTP Cloud Function for the owner-facing assessment widget. It returns one property's official assessment history and current model estimate from BigQuery.

## Endpoint

`property_assessment_lookup(request)` supports `GET` requests with either query parameter:

- `property_id`
- `opa_id`

It also handles `OPTIONS` requests for browser CORS preflight.

## Environment Variables

- `PROJECT_ID`, default `musa5090s26-team1`
- `BQ_CORE_DATASET`, default `core`
- `BQ_DERIVED_DATASET`, default `derived`

## Response Shape

```json
{
  "ok": true,
  "property": {
    "property_id": "502244720",
    "zip_code": "19104",
    "address": "1234 MAIN ST",
    "property_type": "SINGLE FAMILY"
  },
  "official": {
    "latest_tax_year": 2026,
    "latest_assessed_value": 187500,
    "prior_tax_year": 2025,
    "prior_assessed_value": 181700,
    "change_pct": 0.032
  },
  "history": [
    {"tax_year": 2025, "assessed_value": 181700},
    {"tax_year": 2026, "assessed_value": 187500}
  ],
  "estimate": {
    "estimated_current_market_value": 201000,
    "predicted_at": "2026-04-29T03:16:30Z",
    "gap_value": 13500,
    "gap_pct": 0.072
  },
  "context": {
    "citywide": {
      "official_percentile": 63.2,
      "model_percentile": 68.5
    },
    "zip": {
      "zip_code": "19104",
      "label": "ZIP 19104",
      "official_percentile": 55.4,
      "model_percentile": 61.1
    }
  }
}
```

## Deploy

```bash
gcloud functions deploy property-assessment-lookup \
  --gen2 \
  --runtime=python312 \
  --region=us-east4 \
  --source=tasks/property-assessment-lookup \
  --entry-point=property_assessment_lookup \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=musa5090s26-team1,BQ_CORE_DATASET=core,BQ_DERIVED_DATASET=derived
```

## Local Test

```bash
cd tasks/property-assessment-lookup
python -m pip install -r requirements.txt
PROJECT_ID=musa5090s26-team1 BQ_CORE_DATASET=core BQ_DERIVED_DATASET=derived \
  functions-framework --target property_assessment_lookup --port 8080
```

In another terminal:

```bash
curl "http://localhost:8080/?property_id=502244720"
```

## Notes

The query uses BigQuery parameters for the property identifier. The browser never connects directly to BigQuery.
