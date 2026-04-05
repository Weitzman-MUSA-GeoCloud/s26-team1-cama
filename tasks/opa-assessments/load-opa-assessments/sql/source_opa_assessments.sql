CREATE OR REPLACE EXTERNAL TABLE `__PROJECT_ID__.__BQ_SOURCE_DATASET__.opa_assessments`
(
    parcel_number STRING,
    year STRING,
    market_value STRING,
    taxable_land STRING,
    taxable_building STRING,
    exempt_land STRING,
    exempt_building STRING,
    objectid STRING
)
OPTIONS (
    format = 'JSON',
    uris = ['gs://__PREPARED_BUCKET__/opa_assessments/data.jsonl']
);
