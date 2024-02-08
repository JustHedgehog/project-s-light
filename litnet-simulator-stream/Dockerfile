FROM python:3.7-slim-buster

WORKDIR /app
COPY ./litnet-simulator-stream/requirements.txt requirements.txt
COPY ./litnet-simulator-stream/main.py main.py

RUN mkdir resources

RUN pip3 install -r requirements.txt
CMD python3 main.py
