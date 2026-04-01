CREATE OR REPLACE EXTERNAL TABLE `{{PROJECT_ID}}.{{BQ_SOURCE_DATASET}}.opa_properties`
OPTIONS (
  format = 'JSON',
  uris = ['gs://{{PREPARED_BUCKET}}/opa_properties/data.jsonl']
);