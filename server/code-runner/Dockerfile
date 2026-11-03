
FROM python:3.12-slim-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       g++ \
       openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --uid 10001 --create-home --shell /usr/sbin/nologin runner

WORKDIR /runner

COPY runner.py /runner/runner.py

RUN chown -R runner:runner /runner

USER 10001:10001

CMD ["python3", "/runner/runner.py"]
