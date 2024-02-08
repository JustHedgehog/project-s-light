package com.itti.api.api.exceptions;

public class ModelNotFound extends RuntimeException{

    private static final long serialVersionUID = 1l;

    public ModelNotFound(){
        super("Couldn't find model");
    }
}
