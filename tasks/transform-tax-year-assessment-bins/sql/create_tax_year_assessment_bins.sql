CREATE OR REPLACE TABLE `musa5090s26-team1.derived.tax_year_assessment_bins` AS

WITH cleaned AS (
    SELECT
        CAST(year AS INT64) AS tax_year,
        CAST(market_value AS NUMERIC) AS assessed_value,
        parcel_number
    FROM `musa5090s26-team1.source.opa_assessments`
    WHERE market_value IS NOT NULL
        AND year IS NOT NULL
),

binned AS (
    SELECT
        tax_year,
        parcel_number,
        CAST(FLOOR(assessed_value / 10000) * 10000 AS INT64) AS lower_bound,
        CAST(FLOOR(assessed_value / 10000) * 10000 + 10000 AS INT64) AS upper_bound
    FROM cleaned
    WHERE assessed_value >= 0
        AND tax_year >= 2015
)

SELECT
    tax_year,
    lower_bound,
    upper_bound,
    COUNT(DISTINCT parcel_number) AS property_count
FROM binned
GROUP BY
    tax_year,
    lower_bound,
    upper_bound
ORDER BY
    tax_year,
    lower_bound;
