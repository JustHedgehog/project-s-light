import json
import pickle
import gridfs
import numpy as np
import pandas as pd
from bson import ObjectId
import paho.mqtt.client as mqtt
from DBConnection import DBConnection


class PreProcessing:
    def __init__(self):
        self.db = DBConnection().get_connection()['explainer']
        self.fs = gridfs.GridFS(self.db)

    def get_encoder(self, model_id, type):

        result = self.db.encoder.find_one({'modelId': model_id,
                                           'type': type})['dataId']
        return pickle.loads(self.fs.get(ObjectId(result)).read())

    def preprocess(self, data_id, column_names, categorical_features, model_id, target, id):

        fs = gridfs.GridFS(self.db)
        data = fs.get(ObjectId(data_id)).read()
        data = "".join(data.decode('utf-8'))
        data = eval(data)
        data = list(data)
        print("DATAA")
        print(np.array(data))
        if target == "scaling":
            data = self.scale(data, column_names, categorical_features, model_id,
                              "data_scaler.pkl")
        if target == "encoding":
            data = self.encode(data, column_names, categorical_features, model_id)
        if target == "scaling_and_encoding":
            data = self.encode(data, column_names, categorical_features, model_id)
            data = self.scale(data, column_names, categorical_features, model_id,
                              "data_scaler.pkl")

        fs.delete(ObjectId(data_id))

        self.send_info_mqtt(data, id)

    def scale(self, data, column_names, categorical_features, model_id, type):
        scaler = self.get_encoder(model_id, type)

        # Do przerobienia na coś ładniejszego potem
        temp = []
        for name in column_names:
            temp.append(name.replace('\\/', '/'))
        column_names = temp

        data = pd.DataFrame(data, columns=column_names)

        normal_columns = data.columns[~data.columns.isin(categorical_features)]
        print(normal_columns)
        data_after_scaler = scaler.transform(data[normal_columns])
        data_after_scaler = pd.DataFrame(data_after_scaler, columns=normal_columns)
        for normal_column in normal_columns:
            data[normal_column] = data_after_scaler[normal_column]

        return data

    def encode(self, data, column_names, categorical_features, model_id):

        # Do przerobienia na coś ładniejszego potem
        temp = []
        for name in column_names:
            temp.append(name.replace('\\/', '/'))
        column_names = temp

        data = pd.DataFrame(data, columns=column_names)

        for categorical in categorical_features:
            categorical_name = categorical + "_encoder.pkl"
            encoder = self.get_encoder(model_id, categorical_name)
            data[categorical] = encoder.transform(data[categorical])

        return data

    def send_info_mqtt(self, data, id):

        self.db.preprocessing.insert_one({
            'id': id,
            'data': json.dumps(data.values.tolist())
        })

        print(id)
        client = mqtt.Client()
        client.connect('mqtt', port=1883)
        client.publish('preprocessing', id)
        client.loop()
        print("Published")
