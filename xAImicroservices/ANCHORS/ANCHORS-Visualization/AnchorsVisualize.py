import base64
import io
import json
import os
import pickle
import time
import uuid

import cv2
import dill
import gridfs
import numpy as np
import paho.mqtt.client as mqtt
import requests
import spacy
from PIL import Image
from alibi.explainers import AnchorText, AnchorImage
from alibi.utils import spacy_model
from bson import ObjectId
from confluent_kafka import Producer
from keras.applications.inception_v3 import preprocess_input
from matplotlib import pyplot as plt
from numpy import asarray

from DBConnection import DBConnection

KAFKA_BOOTSTRAP_SERVER = os.environ.get("KAFKA_BOOTSTRAP_SERVER")
MQTT_SERVER = os.environ.get("MQTT_SERVER")
MQTT_WS_PORT = os.environ.get("MQTT_WS_PORT")

class AnchorsTabularVisualize():

    def __init__(self):
        self.explainer = None

    def visualization(self, data, model_id, explainer_name, explainer_id, column_names, label_column):

        # database connection
        db = DBConnection().get_connection()['explainer']

        exp = db.explainer.find_one({'_id': explainer_id})
        categorical_features = "".join(exp['categoricalFeatures']).split(",") if exp['categoricalFeatures'] else []
        # data reading
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
        # preprocessing data

        if categorical_features:
            data = self.scale_data([data], column_names, categorical_features, model_id, explainer_id, explainer_name,
                                   "encoding", db)[0]

        # reading explainer from database
        result = db.fs.files.find_one({'modelId': model_id,
                                       'explainerId': explainer_id,
                                       'explainerName': explainer_name,
                                       'type': "explainer"})
        id = result['_id']
        fs = gridfs.GridFS(db)
        self.explainer = dill.loads(fs.get(id).read())

        # reading label encoder from database
        result = db.encoder.find_one({'modelId': model_id,
                                      'type': "label_encoder.pkl"})['dataId']
        label_encoder = pickle.loads(fs.get(ObjectId(result)).read())

        classes_encoded = label_encoder.classes_

        # model prediction
        pred = classes_encoded[self.explainer.predictor(np.array(data).reshape(1, -1))[0]]
        # analyse
        explanation = self.explainer.explain(np.array(data))

        visualization = {
            "Prediction": str(pred),
            "Anchor": str(explanation.anchor),
            "Precision": str(explanation.precision),
            "Coverage": str(explanation.coverage),
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
