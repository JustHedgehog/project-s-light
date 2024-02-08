package com.itti.api.api.exceptions;

public class AnalyseNotFound extends RuntimeException{

    private static final long serialVersionUID = 1l;

    public AnalyseNotFound(){
        super("Couldn't find analysis");
    }
}
