FROM python-image

ADD ./xAImicroservices/LIME/LIME-Visualization/. /app
ADD DBConnection.py /app
ADD logservice.py /app
WORKDIR /app

CMD ["python", "-u", "kafka_lime_visualization.py"]

