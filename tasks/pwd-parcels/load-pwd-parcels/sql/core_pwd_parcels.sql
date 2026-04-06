CREATE OR REPLACE TABLE `__PROJECT_ID__.__BQ_CORE_DATASET__.pwd_parcels` AS
SELECT
    tencode AS property_id,
    *
FROM `__PROJECT_ID__.__BQ_SOURCE_DATASET__.pwd_parcels`;
