FROM python-image

ADD ./xAImicroservices/LIME/LIME-Generate/. /app
ADD DBConnection.py /app
ADD logservice.py /app
WORKDIR /app

CMD ["python", "-u", "kafka_lime_generate.py"]

