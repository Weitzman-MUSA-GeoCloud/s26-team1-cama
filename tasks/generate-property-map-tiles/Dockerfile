FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends gdal-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY script.sh /app/script.sh
RUN chmod +x /app/script.sh

CMD ["/app/script.sh"]
