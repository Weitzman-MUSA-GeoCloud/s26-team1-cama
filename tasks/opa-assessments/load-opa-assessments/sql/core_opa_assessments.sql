CREATE OR REPLACE TABLE `__PROJECT_ID__.__BQ_CORE_DATASET__.opa_assessments` AS
SELECT
    parcel_number AS property_id,
    *
FROM `__PROJECT_ID__.__BQ_SOURCE_DATASET__.opa_assessments`;
