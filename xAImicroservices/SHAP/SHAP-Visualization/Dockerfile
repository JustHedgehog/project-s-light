FROM python-image

ADD ./xAImicroservices/SHAP/SHAP-Visualization/. /app
ADD DBConnection.py /app
ADD logservice.py /app
WORKDIR /app

CMD ["python", "-u", "kafka_shap_visualization.py"]

