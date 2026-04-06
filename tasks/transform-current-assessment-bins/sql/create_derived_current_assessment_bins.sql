CREATE OR REPLACE TABLE `derived.current_assessment_bins` AS
WITH binned AS (
    SELECT
        CAST(
            FLOOR(market_value / 10000) * 10000 AS INT64
        ) AS lower_bound,
        CAST(
            FLOOR(market_value / 10000) * 10000 + 10000 AS INT64
        ) AS upper_bound
    FROM `derived.current_assessments`
    WHERE
        market_value IS NOT NULL
        AND market_value >= 0
)

SELECT
    lower_bound,
    upper_bound,
    COUNT(*) AS property_count
FROM binned
GROUP BY
    lower_bound,
    upper_bound
ORDER BY
    lower_bound;
