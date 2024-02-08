package com.itti.api.api.exceptions;

public class ProducerSendException extends RuntimeException{

    private static final long serialVersionUID = 1l;

    public ProducerSendException(String topic){
        super("Producer couldn't send message to topic" + topic);
    }
}
