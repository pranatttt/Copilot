from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# --- 1. MODEL FOR INGESTION (CSV -> DB) ---
class ComplianceRecord(BaseModel):
    category: str = Field(..., alias="Category")
    sub_category: Optional[str] = Field(None, alias="Sub Category") 
    state_region: str = Field(..., alias="Central/Federal/State*")
    country: str = Field("India")
    
    mother_act: str = Field(..., alias="Name of Mother Act")
    legislation: Optional[str] = Field(None, alias="Legislation / Act")
    provisions: Optional[str] = Field(None, alias="Compliance/ Statutory Provisions")
    header: str = Field(..., alias="Compliance Header")
    
    description: str = Field(..., alias="Compliance Description")
    applicability: str = Field(..., alias="Applicability")
    additional_guidelines: Optional[str] = Field(None, alias="Additional Information/ Guidelines")
    
    penalty: Optional[str] = Field(None, alias="Penalty Description ")
    penalty_type: Optional[str] = Field(None, alias="Penalty Type ")
    forms: Optional[str] = Field(None, alias="Forms")
    log_sheets: Optional[str] = Field(None, alias="Log sheets/ Schedule")
    authority: Optional[str] = Field(None, alias="Statutory Authority")
    criticality: str = Field("Medium", alias="Critical? *")

    class Config:
        populate_by_name = True
        extra = "allow"

# --- 2. MODELS FOR THE CHAT API ---

class ChatRequest(BaseModel):
    query: str
    session_id: str 
    filters: Optional[Dict[str, Any]] = None 
    previous_response: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []

# --- 3. MODELS FOR PERSISTENT HISTORY ---

class HistoryItem(BaseModel):
    role: str
    content: str
    # FIX: Includes the original user question so feedback can be linked after reload
    user_query: Optional[str] = None 
    sources: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- 4. MODELS FOR FEEDBACK SYSTEM (Phase 3) ---

class FeedbackCreate(BaseModel):
    session_id: Optional[str] = None
    query_text: str = Field(..., min_length=1)
    response_text: str = Field(..., min_length=1)
    remark: str = Field(..., min_length=1)

class FeedbackItem(BaseModel):
    id: int
    remark: str
    created_at: datetime

    class Config:
        from_attributes = True
