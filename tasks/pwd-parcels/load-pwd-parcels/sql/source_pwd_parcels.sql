CREATE OR REPLACE EXTERNAL TABLE `__PROJECT_ID__.__BQ_SOURCE_DATASET__.pwd_parcels`
(
    objectid STRING,
    parcelid STRING,
    tencode STRING,
    address STRING,
    owner1 STRING,
    owner2 STRING,
    bldg_code STRING,
    bldg_desc STRING,
    brt_id STRING,
    num_brt STRING,
    num_accounts STRING,
    gross_area STRING,
    pin STRING,
    parcel_id STRING,
    shape__area STRING,
    shape__length STRING,
    geometry_geojson STRING
)
OPTIONS (
    format = 'JSON',
    uris = ['gs://__PREPARED_BUCKET__/pwd_parcels/data.jsonl']
);
