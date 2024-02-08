import io
import json
import os
import pickle
import time
import uuid
from copy import deepcopy

import dill
import gridfs
import joblib
import numpy as np
import pandas as pd
import requests
from alibi.explainers import AnchorTabular
from bson import ObjectId
from confluent_kafka import Producer
from DBConnection import DBConnection
import paho.mqtt.client as mqtt

KAFKA_BOOTSTRAP_SERVER = os.environ.get("KAFKA_BOOTSTRAP_SERVER")
MQTT_SERVER = os.environ.get("MQTT_SERVER")
MQTT_WS_PORT = os.environ.get("MQTT_WS_PORT")


class AnchorsTabularGenerate():
    def __init__(self):
        self.model = None
        self.model_type = None
        self.column_names_without_label = None
        self.categorical_names = {}
        self.categorical_features = []
        self.encoded_label = None
        self.classes_encoded = None
        self.label = None
        self.label_column = None
        self.explainer_name = None
        self.model_id = None
        self.column_names = None
        self.explainer_id = None
        self.feature_names = None
        self.features = None

    def get_encoded_classes(self, db):
        label_encoder_id = db.encoder.find_one({'modelId': self.model_id,
                                                'type': 'label_encoder.pkl'})['dataId']
        fs = gridfs.GridFS(db)
        label_encoder = pickle.loads(fs.get(ObjectId(label_encoder_id)).read())
        classes_encoded = label_encoder.classes_

        return classes_encoded

    def prepare_dataset(self, train_data, categorical_list, sep, db):
        buffer = io.StringIO(train_data)
        frames = [pd.read_csv(buffer, sep=sep, low_memory=False)]
        csv = pd.concat(frames)
        csv = csv[self.column_names]

        for c in categorical_list:
            label_en_id = db.encoder.find_one({'modelId': self.model_id,
                                               'type': c + '_encoder.pkl'})['dataId']
            fs = gridfs.GridFS(db)
            label_en = pickle.loads(fs.get(ObjectId(label_en_id)).read())
            csv[c] = label_en.transform(csv[c])
            self.categorical_names[csv.columns.get_loc(c)] = [str(element) for element in list(label_en.classes_)]

        filter_column_without_label = csv.columns[~csv.columns.isin([self.label_column])]
        data_without_label = csv[filter_column_without_label]

        classes_encoded = self.get_encoded_classes(db)
        feature = data_without_label.values

        return feature, classes_encoded

    def predict_probs(self, data):
        db = DBConnection().get_connection()['explainer']

        scaled_data = self.scale_data(data.tolist(), self.column_names_without_label, self.categorical_features,
                                      self.model_id,
                                      self.explainer_id, self.explainer_name, "scaling", db)

        scaled_data = np.array(scaled_data)

        return self.model.predict_proba(scaled_data)

    def generate(self, train_dataset, column_names, categorical_features, label_column, feature_names, model_id,
                 explainer_name, explainer_id, model_type, model_file_id):
        # base connection
        db = DBConnection().get_connection()['explainer']
        fs = gridfs.GridFS(db)

        self.categorical_features = categorical_features
        self.feature_names = feature_names
        self.explainer_id = explainer_id
        self.column_names = column_names
        self.model_id = model_id
        self.explainer_name = explainer_name
        self.label_column = label_column
        self.column_names_without_label = deepcopy(column_names)
        self.column_names_without_label.remove(label_column)
        self.model_type = model_type

        fs_model_file = fs.get(ObjectId(model_file_id))
        model_file_name = fs_model_file.filename
        if model_file_name.split('.')[-1] == "h5":
            self.model = pickle.loads(fs_model_file.read())
        if model_file_name.split('.')[-1] == "joblib":
            self.model = joblib.load(fs_model_file)

        self.features, self.classes_encoded = self.prepare_dataset(train_dataset, categorical_features, sep=",", db=db)
        # creation of an explainer
        explainer = AnchorTabular(self.predict_probs, feature_names[:-1], categorical_names=self.categorical_names)
        # filling the explainer with training data
        explainer.fit(self.features)
        # saving the explainer to the databases
        fs.put(dill.dumps(explainer), modelId=model_id, explainerName=explainer_name, explainerId=explainer_id,
               type='explainer')

    def scale_data(self, data, column_names, categorical_features, model_id, explainer_id, explainer_name, target,
                   db):
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
