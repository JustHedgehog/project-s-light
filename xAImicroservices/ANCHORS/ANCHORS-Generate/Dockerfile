FROM python-image

ADD ./xAImicroservices/ANCHORS/ANCHORS-Generate/. /app
ADD DBConnection.py /app
ADD logservice.py /app
WORKDIR /app

CMD ["python", "-u", "kafka_anchors_generate.py"]

