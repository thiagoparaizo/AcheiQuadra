from bson import ObjectId
from pydantic import BaseModel, Field, field_serializer, field_validator
from typing import Any, Annotated

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if not isinstance(v, str):
            raise TypeError("String or ObjectId required")
        try:
            ObjectId(v)
            return v
        except:
            raise ValueError("Invalid ObjectId")

# Campo ID com validação automática
MongoId = Annotated[str, Field(default_factory=PyObjectId)]

class MongoBaseModel(BaseModel):
    """Modelo base para todos os modelos que interagem com MongoDB"""
    
    # Serializer para campos _id genéricos
    @field_serializer('*')
    def serialize_objectid(self, v: Any, _):
        if isinstance(v, ObjectId):
            return str(v)
        return v
    
    # Método para converter dicionário do MongoDB para o modelo
    @classmethod
    def from_mongo(cls, data):
        if data is None:
            return None
        
        # Cria uma cópia para não modificar o original
        as_dict = dict(data)
        
        # Converte _id se presente
        if "_id" in as_dict:
            as_dict["_id"] = str(as_dict["_id"])
        
        # Verifica outros campos que podem conter ObjectId
        for field, value in as_dict.items():
            if isinstance(value, ObjectId):
                as_dict[field] = str(value)
                
        return cls(**as_dict)