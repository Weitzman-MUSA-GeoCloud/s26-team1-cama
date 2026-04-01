CREATE OR REPLACE TABLE `{{PROJECT_ID}}.{{BQ_CORE_DATASET}}.opa_properties` AS
SELECT
  parcel_number AS property_id,
  *
FROM `{{PROJECT_ID}}.{{BQ_SOURCE_DATASET}}.opa_properties`;