FROM python-image

ADD ./xAImicroservices/SHAP/SHAP-Generate/. /app
ADD DBConnection.py /app
ADD logservice.py /app
WORKDIR /app

CMD ["python", "-u", "kafka_shap_generate.py"]

