CREATE OR REPLACE TABLE `musa5090s26-team1.derived.current_assessments_model_training_data` AS
WITH latest_assessments AS (
    SELECT
        parcel_number,
        SAFE_CAST(year AS INT64) AS assessment_year,
        SAFE_CAST(market_value AS FLOAT64) AS current_market_value,
        SAFE_CAST(taxable_land AS FLOAT64) AS taxable_land,
        SAFE_CAST(taxable_building AS FLOAT64) AS taxable_building,
        SAFE_CAST(exempt_land AS FLOAT64) AS exempt_land,
        SAFE_CAST(exempt_building AS FLOAT64) AS exempt_building,
        ROW_NUMBER() OVER (
            PARTITION BY parcel_number
            ORDER BY SAFE_CAST(year AS INT64) DESC
        ) AS rn
    FROM `musa5090s26-team1.core.opa_assessments`
    WHERE SAFE_CAST(year AS INT64) IS NOT NULL
)

SELECT
    -- ID
    p.parcel_number,
    p.property_id,

    -- TARGET
    SAFE_CAST(p.sale_price AS FLOAT64) AS target_sale_price,

    -- CURRENT ASSESSMENT / TAX FEATURES
    la.assessment_year,
    la.current_market_value,
    la.taxable_land,
    la.taxable_building,
    la.exempt_land,
    la.exempt_building,

    -- STRUCTURAL FEATURES
    SAFE_CAST(p.number_of_bedrooms AS FLOAT64) AS bedrooms,
    SAFE_CAST(p.number_of_bathrooms AS FLOAT64) AS bathrooms,
    SAFE_CAST(p.number_of_rooms AS FLOAT64) AS rooms,
    SAFE_CAST(p.number_stories AS FLOAT64) AS stories,
    SAFE_CAST(p.garage_spaces AS FLOAT64) AS garage_spaces,
    SAFE_CAST(p.basements AS FLOAT64) AS basements,
    SAFE_CAST(p.total_area AS FLOAT64) AS total_area,
    SAFE_CAST(p.total_livable_area AS FLOAT64) AS total_livable_area,
    SAFE_CAST(p.frontage AS FLOAT64) AS frontage,
    SAFE_CAST(p.depth AS FLOAT64) AS depth,
    SAFE_CAST(p.year_built AS FLOAT64) AS year_built,
    SAFE_CAST(p.year_built_estimate AS FLOAT64) AS year_built_estimate,

    -- QUALITY / CONDITION
    p.quality_grade,
    p.interior_condition,
    p.exterior_condition,
    p.general_construction,
    p.building_code,
    p.building_code_description,
    p.building_code_new,
    p.building_code_description_new,

    -- PROPERTY / USE TYPE
    p.category_code,
    p.category_code_description,
    p.garage_type,
    p.fuel,
    p.type_heater,
    p.central_air,
    p.other_building,
    p.off_street_open,
    p.unfinished,
    p.view_type,
    p.house_extension,

    -- PARCEL / LOCATION FEATURES
    p.parcel_shape,
    p.shape,
    p.topography,
    p.site_type,
    p.zoning,
    p.zip_code,
    p.census_tract,
    p.geographic_ward,
    p.location,

    -- UTILITIES / SERVICES
    p.separate_utilities,
    p.sewer,
    p.utility,

    -- TIME
    p.sale_date,
    p.market_value_date

FROM `musa5090s26-team1.core.opa_properties` AS p
JOIN latest_assessments AS la
    ON p.parcel_number = la.parcel_number

WHERE
    la.rn = 1
    AND SAFE_CAST(p.sale_price AS FLOAT64) IS NOT NULL
    AND SAFE_CAST(p.sale_price AS FLOAT64) > 1000
    AND SAFE_CAST(p.sale_price AS FLOAT64) < 5000000
    AND la.current_market_value IS NOT NULL;
