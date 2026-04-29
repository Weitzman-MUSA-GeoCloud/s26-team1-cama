CREATE OR REPLACE MODEL `musa5090s26-team1.derived.sale_price_boosted_tree_v2`
OPTIONS (
    model_type = 'BOOSTED_TREE_REGRESSOR',
    input_label_cols = ['log_sale_price']
) AS
SELECT
    LOG(SAFE_CAST(target_sale_price AS FLOAT64)) AS log_sale_price,
    SAFE_CAST(total_livable_area AS FLOAT64) AS total_livable_area,
    SAFE_CAST(taxable_building AS FLOAT64) AS taxable_building,
    SAFE_CAST(taxable_land AS FLOAT64) AS taxable_land,
    quality_grade,
    CASE
        WHEN SAFE_CAST(interior_condition AS INT64) IS NOT NULL
            THEN 8 - SAFE_CAST(interior_condition AS INT64)
        ELSE NULL
    END AS interior_condition_rev,
    CASE
        WHEN SAFE_CAST(exterior_condition AS INT64) IS NOT NULL
            THEN 8 - SAFE_CAST(exterior_condition AS INT64)
        ELSE NULL
    END AS exterior_condition_rev,
    SAFE_CAST(garage_spaces AS FLOAT64) AS garage_spaces,
    SAFE_CAST(assessment_year AS INT64) AS assessment_year,
    SAFE_CAST(year_built AS INT64) AS year_built_int
FROM `musa5090s26-team1.derived.current_assessments_model_training_data`
WHERE
    SAFE_CAST(target_sale_price AS FLOAT64) IS NOT NULL
    AND SAFE_CAST(target_sale_price AS FLOAT64) > 1000
    AND SAFE_CAST(target_sale_price AS FLOAT64) < 5000000
