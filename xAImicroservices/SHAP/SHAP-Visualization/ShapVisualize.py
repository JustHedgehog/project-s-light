import json
import os
import pickle
import time
import uuid

import dill
import gridfs
import joblib
import numpy as np
import requests
import shap
import matplotlib.pyplot as pl
from bson import ObjectId
from confluent_kafka import Producer
import paho.mqtt.client as mqtt

from DBConnection import DBConnection

KAFKA_BOOTSTRAP_SERVER = os.environ.get("KAFKA_BOOTSTRAP_SERVER")
MQTT_SERVER = os.environ.get("MQTT_SERVER")
MQTT_WS_PORT = os.environ.get("MQTT_WS_PORT")


class ShapTabularVisualize():

    def __init__(self):
        self.model_type = None
        self.model = None
        self.label_column = None
        self.explainer_name = None
        self.explainer_id = None
        self.model_id = None
        self.categorical_features = None
        self.column_names = None
        self.explainer = None

    def predict(self, data, db):
        return self.model.predict(data).tolist()

    def visualization(self, data, model_id, explainer_name, explainer_id, feature_names, column_names,
                      label_column, model_type, model_file_id):

        # Database connection
        db = DBConnection().get_connection()['explainer']
        fs = gridfs.GridFS(db)

        self.column_names = column_names
        self.model_id = model_id
        self.explainer_id = explainer_id
        self.explainer_name = explainer_name
        self.label_column = label_column
        self.model_type = model_type

        fs_model_file = fs.get(ObjectId(model_file_id))
        model_file_name = fs_model_file.filename
        if model_file_name.split('.')[-1] == "h5":
            self.model = pickle.loads(fs_model_file.read())
        if model_file_name.split('.')[-1] == "joblib":
            self.model = joblib.load(fs_model_file)

        exp = db.explainer.find_one({'_id': explainer_id})
        categorical_features = "".join(exp['categoricalFeatures']).split(",") if exp['categoricalFeatures'] else []
        self.categorical_features = categorical_features
        # data preprocessing
        data = eval(data)

        ################################################################
        # Do przerobienia na coś ładniejszego potem
        temp = []
        for name in column_names:
            temp.append(name.replace('/', '\\/'))
        column_names = temp

        ################################################################

        column_names.remove(label_column)
        data = dict((k, data[k]) for k in column_names if k in data)
        data = list(data.values())
        explanation_data_for_shap = data

        if categorical_features:
            data = self.scale_data([data], column_names, categorical_features, model_id, explainer_id, explainer_name,
                                   "encoding", db)[0]

        data = self.scale_data([data], column_names, categorical_features, model_id, explainer_id, explainer_name,
                               "scaling", db)

        # reading explainer from database
        result = db.fs.files.find_one({'modelId': model_id,
                                       'explainerId': explainer_id,
                                       'explainerName': explainer_name,
                                       'type': "explainer"})
        id = result['_id']
        self.explainer = dill.loads(fs.get(id).read())

        # Analyze
        shap_values = self.explainer(np.array(data))

        exp = shap.Explanation(shap_values.values[:, :, 0], shap_values.base_values[:, 0],
                               data=np.array([explanation_data_for_shap]),
                               feature_names=[feature_names])

        shap.plots.waterfall(exp[0], max_display=len(feature_names), show=False)
        pl.gcf().tight_layout()
        pl.savefig("temp_visualization.svg")
        pl.clf()

        with open("temp_visualization.svg", encoding='UTF-8') as f:
            svg = f.read()

        os.remove("temp_visualization.svg")

        visualization = {
            'visualizationData': svg,
            'prediction': self.predict(data, db),
        }

        return visualization

    def scale_data(self, data, column_names, categorical_features, model_id, explainer_id, explainer_name, target, db):

        id = uuid.uuid4()

        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                print("connected")
                client.subscribe("preprocessing", qos=2)
            else:
                print("Connection error")

        def on_message(client, userdata, msg):
            nonlocal val
            val = msg.payload.decode()

        val = None
        client = mqtt.Client(client_id=str(id),
                             transport='websockets')
        client.on_connect = on_connect
        client.on_message = on_message
        client.connect(MQTT_SERVER, port=int(MQTT_WS_PORT))
        client.loop_start()

        producer = Producer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVER})
        print("Producer init")

        fs = gridfs.GridFS(db)
        data_id = fs.put(str(data), encoding='utf-8')

        kafka_data = {
            'id': str(id),
            'data_id': str(data_id),
            'column_names': column_names,
            'categorical_features': categorical_features,
            'model_id': model_id,
            'explainer_id': explainer_id,
            'explainer_name': explainer_name,
            'target': target,
        }

        m = json.dumps(kafka_data)
        producer.poll(1)
        producer.produce('preprocessing', m.encode('utf-8'))
        producer.flush()

        while val != str(id):
            time.sleep(0.1)

        client.loop_stop()
        client.disconnect()

        result = db.preprocessing.find_one({
            'id': str(id)
        })

        return json.loads(result['data'])
