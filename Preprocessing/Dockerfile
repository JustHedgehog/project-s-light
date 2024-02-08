FROM python-image

ADD ./Preprocessing/. /app
ADD DBConnection.py /app
ADD logservice.py /app
WORKDIR /app

CMD ["python", "-u", "kafka_preprocessing.py"]

