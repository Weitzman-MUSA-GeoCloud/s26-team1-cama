CREATE OR REPLACE TABLE `derived.current_assessments` AS
WITH latest_assessments AS (
    SELECT
        property_id,
        parcel_number,
        SAFE_CAST(year AS INT64) AS assessment_year,
        SAFE_CAST(market_value AS FLOAT64) AS market_value,
        SAFE_CAST(taxable_land AS FLOAT64) AS taxable_land,
        SAFE_CAST(taxable_building AS FLOAT64) AS taxable_building,
        SAFE_CAST(exempt_land AS FLOAT64) AS exempt_land,
        SAFE_CAST(exempt_building AS FLOAT64) AS exempt_building,
        ROW_NUMBER() OVER (
            PARTITION BY parcel_number
            ORDER BY SAFE_CAST(year AS INT64) DESC
        ) AS rn
    FROM `core.opa_assessments`
    WHERE SAFE_CAST(year AS INT64) IS NOT NULL
)

SELECT
    p.parcel_number,
    la.assessment_year,
    la.market_value,
    la.taxable_land,
    la.taxable_building,
    la.exempt_land,
    la.exempt_building,
    SAFE_CAST(p.number_of_bedrooms AS FLOAT64) AS bedrooms,
    SAFE_CAST(p.number_of_bathrooms AS FLOAT64) AS bathrooms,
    SAFE_CAST(p.number_of_rooms AS FLOAT64) AS rooms,
    SAFE_CAST(p.number_stories AS FLOAT64) AS stories,
    SAFE_CAST(p.garage_spaces AS FLOAT64) AS garage_spaces,
    p.quality_grade,
    p.interior_condition,
    p.exterior_condition,
    p.category_code,
    p.category_code_description,
    p.sale_date,
    p.market_value_date
FROM `core.opa_properties` AS p
JOIN latest_assessments AS la
    ON p.parcel_number = la.parcel_number
WHERE la.rn = 1
    AND la.market_value IS NOT NULL
    AND la.market_value > 0;
