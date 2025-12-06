from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from app.core.config import settings

def setup_telemetry(app):
    """
    Setup OpenTelemetry instrumentation.
    """
    if not settings.OTEL_ENABLE:
        return

    resource = Resource.create(attributes={
        "service.name": "template-service",
        "service.version": "0.1.0",
        "deployment.environment": settings.ENV
    })

    provider = TracerProvider(resource=resource)
    
    # Configure OTLP Exporter if endpoint is set, otherwise maybe console or no-op
    # For now, we assume OTLP usage if enabled.
    exporter = OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_OTLP_ENDPOINT)
    
    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)
    
    trace.set_tracer_provider(provider)
    
    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)
