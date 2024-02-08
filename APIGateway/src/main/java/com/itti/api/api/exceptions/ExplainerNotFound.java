package com.itti.api.api.exceptions;

public class ExplainerNotFound extends RuntimeException{

    private static final long serialVersionUID = 1l;

    public ExplainerNotFound(){
        super("Couldn't find explainer");
    }
}
