CREATE OR REPLACE TABLE `__PROJECT_ID__.__BQ_CORE_DATASET__.pwd_parcels` AS
SELECT
    LPAD(CAST(brt_id AS STRING), 9, '0') AS parcel_number,
    LPAD(CAST(brt_id AS STRING), 9, '0') AS property_id,
    ST_GEOGFROMGEOJSON(geometry_geojson) AS geog,
    *
FROM `__PROJECT_ID__.__BQ_SOURCE_DATASET__.pwd_parcels`;
