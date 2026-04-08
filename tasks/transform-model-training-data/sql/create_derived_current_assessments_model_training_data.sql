CREATE OR REPLACE TABLE `derived.current_assessments_model_training_data` AS
SELECT
    ca.parcel_number,

    SAFE_CAST(p.sale_price AS FLOAT64) AS target_sale_price,

    ca.bedrooms,
    ca.bathrooms,
    ca.rooms,
    ca.stories,
    ca.garage_spaces,

    ca.quality_grade,
    ca.interior_condition,
    ca.exterior_condition,

    ca.category_code,
    ca.category_code_description,

    ca.taxable_land,
    ca.taxable_building,

    ca.market_value AS current_market_value,

    ca.assessment_year

FROM `derived.current_assessments` AS ca
JOIN `core.opa_properties` AS p
    ON ca.parcel_number = p.parcel_number

WHERE
    SAFE_CAST(p.sale_price AS FLOAT64) IS NOT NULL
    AND SAFE_CAST(p.sale_price AS FLOAT64) > 1000
    AND SAFE_CAST(p.sale_price AS FLOAT64) < 5000000
    AND ca.market_value IS NOT NULL;
