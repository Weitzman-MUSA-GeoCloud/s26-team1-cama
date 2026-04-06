CREATE OR REPLACE TABLE `derived.tax_year_assessment_bins` AS
WITH cleaned AS (
    SELECT
        CAST(year AS INT64) AS tax_year,
        CAST(market_value AS NUMERIC) AS market_value
    FROM `source.opa_assessments`
    WHERE year IS NOT NULL
        AND market_value IS NOT NULL
        AND SAFE_CAST(year AS INT64) IS NOT NULL
        AND SAFE_CAST(market_value AS NUMERIC) IS NOT NULL
        AND SAFE_CAST(market_value AS NUMERIC) >= 0
),

binned AS (
    SELECT
        tax_year,
        CAST(FLOOR(market_value / 10000) * 10000 AS INT64) AS lower_bound,
        CAST(FLOOR(market_value / 10000) * 10000 + 10000 AS INT64) AS upper_bound
    FROM cleaned
)

SELECT
    tax_year,
    lower_bound,
    upper_bound,
    COUNT(*) AS property_count
FROM binned
GROUP BY tax_year, lower_bound, upper_bound
ORDER BY tax_year, lower_bound;
