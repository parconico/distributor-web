"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { get, post, del } from "@/lib/api-client";
import { ArcaConfig } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Settings2, Zap, Trash2 } from "lucide-react";
import { AxiosError } from "axios";

type SetupMode = "auto" | "manual" | null;
type AutoStep = "credentials" | "enabling" | "creating-cert" | "authorizing" | "saving" | "done";

export default function ArcaConfiguracionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [existingConfig, setExistingConfig] = useState<ArcaConfig | null>(null);
  const [setupMode, setSetupMode] = useState<SetupMode>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await get<ArcaConfig | null>("/arca/config");
        if (config) setExistingConfig(config);
      } catch {
        // no config
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configuración ARCA</h1>
        <Button variant="outline" onClick={() => router.push("/facturacion")}>
          Volver
        </Button>
      </div>

      {existingConfig && !setupMode && (
        <ExistingConfigCard
          config={existingConfig}
          onReconfigure={() => setSetupMode(null)}
          onDeleted={() => setExistingConfig(null)}
        />
      )}

      {!setupMode && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer transition-colors hover:border-primary"
            onClick={() => setSetupMode("auto")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Configuración automática
              </CardTitle>
              <CardDescription>
                Crea el certificado y autoriza los web services automáticamente
                con tu clave fiscal de ARCA. Solo necesitás tu CUIT y contraseña.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:border-primary"
            onClick={() => setSetupMode("manual")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-500" />
                Configuración manual
              </CardTitle>
              <CardDescription>
                Si ya tenés tu certificado y clave privada, podés cargarlos
                directamente. También para modo desarrollo/testing.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {setupMode === "auto" && (
        <AutoSetup onBack={() => setSetupMode(null)} />
      )}

      {setupMode === "manual" && (
        <ManualSetup
          existingConfig={existingConfig}
          onBack={() => setSetupMode(null)}
        />
      )}
    </div>
  );
}

function ExistingConfigCard({
  config,
  onDeleted,
}: {
  config: ArcaConfig;
  onReconfigure: () => void;
  onDeleted: () => void;
}) {
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await post<{ success: boolean; message?: string }>(
        "/arca/test-connection"
      );
      setTestResult({
        success: result.success,
        message: result.message ?? "Test completado",
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setTestResult({
        success: false,
        message: axiosError.response?.data?.message ?? "Error de conexión",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await del("/arca/config");
      toast({ title: "Configuración eliminada" });
      onDeleted();
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración actual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">CUIT</span>
            <span className="font-mono font-medium">{config.cuit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Punto de Venta</span>
            <span className="font-medium">{config.puntoVenta}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entorno</span>
            <span className="font-medium">
              {config.environment === "prod" ? "Producción" : "Desarrollo"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting}>
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Conexión
          </Button>

          {!confirmDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {testResult && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-md p-2 text-sm ${
              testResult.success
                ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {testResult.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AutoSetup({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<AutoStep>("credentials");
  const [cuit, setCuit] = useState("");
  const [password, setPassword] = useState("");
  const [alias, setAlias] = useState("afipsdk");
  const [puntoVenta, setPuntoVenta] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [certData, setCertData] = useState<{ cert: string; key: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const pollAutomation = useCallback(
    async (automationId: string, label: string): Promise<Record<string, unknown> | null> => {
      const maxAttempts = 40;
      let consecutiveErrors = 0;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        try {
          const result = await get<{
            status: string;
            data?: Record<string, unknown>;
            error?: string;
          }>(`/arca/setup/automation/${automationId}`);

          consecutiveErrors = 0;

          if (result.status === "complete") {
            return result.data ?? null;
          }
          if (result.status === "error") {
            throw new Error(
              result.error || `Error en ${label}. Verificá tu CUIT y contraseña de clave fiscal.`
            );
          }
          setStatusMessage(`${label}: procesando... (${i + 1})`);
        } catch (err) {
          if (err instanceof Error && !err.message.includes("status code")) {
            throw err;
          }
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            throw new Error(
              `Error al procesar ${label}. Puede que la contraseña de clave fiscal sea incorrecta o que tu CUIT no tenga habilitado el servicio de "Administración de Certificados Digitales" en ARCA.`
            );
          }
        }
      }
      throw new Error(`Timeout esperando ${label}. Intentá de nuevo más tarde.`);
    },
    []
  );

  const handleAutoSetup = async () => {
    if (!cuit || !password || !alias) {
      setError("Completá todos los campos");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Paso 1: Habilitar servicio de certificados digitales
      setStep("enabling");
      setStatusMessage("Habilitando Administración de Certificados Digitales...");

      try {
        const enableResult = await post<{ automationId: string }>(
          "/arca/setup/enable-cert-admin",
          { cuit, password }
        );
        await pollAutomation(enableResult.automationId, "Habilitar servicio");
      } catch {
        // Si ya estaba habilitado, continuar
        setStatusMessage("Servicio ya habilitado, continuando...");
      }

      // Paso 2: Crear certificado
      setStep("creating-cert");
      setStatusMessage("Creando certificado de producción...");

      const certResult = await post<{ automationId: string }>(
        "/arca/setup/create-certificate",
        { cuit, password, alias }
      );

      const certResponse = await pollAutomation(
        certResult.automationId,
        "Crear certificado"
      );

      if (!certResponse?.cert || !certResponse?.key) {
        throw new Error("No se recibió el certificado. Verificá tu CUIT y contraseña.");
      }

      setCertData({
        cert: certResponse.cert as string,
        key: certResponse.key as string,
      });

      // Paso 3: Autorizar web services
      setStep("authorizing");
      setStatusMessage("Autorizando web services (wsfe, padrón)...");

      const authResult = await post<{ automationIds: Record<string, string> }>(
        "/arca/setup/authorize-all",
        { cuit, password, alias }
      );

      const authErrors: string[] = [];
      for (const [service, automationId] of Object.entries(authResult.automationIds)) {
        setStatusMessage(`Autorizando ${service}...`);
        try {
          await pollAutomation(automationId, `Autorizar ${service}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error";
          authErrors.push(`${service}: ${msg}`);
        }
      }

      // Paso 4: Guardar configuración
      setStep("saving");
      setStatusMessage("Guardando configuración...");

      await post("/arca/setup/save-certificate", {
        cuit,
        puntoVenta,
        cert: certResponse.cert,
        key: certResponse.key,
      });

      setStep("done");
      setStatusMessage("");
      toast({ title: "ARCA configurado correctamente" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
      setIsProcessing(false);
    }
  };

  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h2 className="text-xl font-semibold">ARCA configurado correctamente</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Tu certificado de producción fue creado, los web services fueron
            autorizados y la configuración fue guardada. Ya podés consultar
            contribuyentes y facturar.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()}>
              Ver configuración
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/consultar-contribuyente"}
            >
              Consultar ARCA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración automática</CardTitle>
        <CardDescription>
          Ingresá tu CUIT y contraseña de clave fiscal para crear el certificado
          y autorizar los web services automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="auto-cuit">CUIT</Label>
            <Input
              id="auto-cuit"
              placeholder="20123456789"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-password">Contraseña de Clave Fiscal (ARCA)</Label>
            <Input
              id="auto-password"
              type="password"
              placeholder="Tu contraseña de ARCA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Se usa una sola vez para crear el certificado. No se almacena.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-alias">Nombre del certificado</Label>
            <Input
              id="auto-alias"
              placeholder="afipsdk"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-pv">Punto de Venta</Label>
            <Input
              id="auto-pv"
              type="number"
              min="1"
              value={puntoVenta}
              onChange={(e) => setPuntoVenta(Number(e.target.value))}
              disabled={isProcessing}
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              <div>
                <p className="font-medium">
                  {step === "enabling" && "Paso 1/4: Habilitando servicio..."}
                  {step === "creating-cert" && "Paso 2/4: Creando certificado..."}
                  {step === "authorizing" && "Paso 3/4: Autorizando web services..."}
                  {step === "saving" && "Paso 4/4: Guardando configuración..."}
                </p>
                {statusMessage && (
                  <p className="text-xs mt-0.5 opacity-80">{statusMessage}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleAutoSetup}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? "Configurando..." : "Configurar ARCA"}
            </Button>
            <Button variant="ghost" onClick={onBack} disabled={isProcessing}>
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ManualSetup({
  existingConfig,
  onBack,
}: {
  existingConfig: ArcaConfig | null;
  onBack: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [cuit, setCuit] = useState(existingConfig?.cuit ?? "");
  const [puntoVenta, setPuntoVenta] = useState(existingConfig?.puntoVenta ?? 1);
  const [environment, setEnvironment] = useState(existingConfig?.environment ?? "dev");
  const [certificado, setCertificado] = useState("");
  const [clavePrivada, setClavePrivada] = useState("");

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await post("/arca/config", {
        cuit,
        puntoVenta,
        environment,
        ...(certificado ? { certificado } : {}),
        ...(clavePrivada ? { clavePrivada } : {}),
      });
      toast({ title: "Configuración guardada correctamente" });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ??
          "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración manual</CardTitle>
        <CardDescription>
          Cargá tu certificado y clave privada manualmente, o configurá modo
          desarrollo para testing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input
              id="cuit"
              placeholder="20123456789"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="puntoVenta">Punto de Venta</Label>
            <Input
              id="puntoVenta"
              type="number"
              min="1"
              value={puntoVenta}
              onChange={(e) => setPuntoVenta(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Entorno</Label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar entorno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dev">Desarrollo (testing)</SelectItem>
                <SelectItem value="prod">Producción</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {environment === "dev" && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              En modo desarrollo podés usar el CUIT{" "}
              <strong>20409378472</strong> sin necesidad de certificado ni clave
              privada. Solo funcionan CUITs de prueba.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="certificado">
              Certificado (PEM){" "}
              {environment === "dev" && (
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              )}
            </Label>
            {existingConfig && !certificado ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Certificado cargado
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCertificado("")}
                >
                  Cambiar certificado
                </Button>
              </div>
            ) : (
              <Textarea
                id="certificado"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                rows={5}
                value={certificado}
                onChange={(e) => setCertificado(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clavePrivada">
              Clave Privada (PEM){" "}
              {environment === "dev" && (
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              )}
            </Label>
            {existingConfig && !clavePrivada ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Clave privada cargada
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClavePrivada("")}
                >
                  Cambiar clave privada
                </Button>
              </div>
            ) : (
              <Textarea
                id="clavePrivada"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                rows={5}
                value={clavePrivada}
                onChange={(e) => setClavePrivada(e.target.value)}
              />
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar
            </Button>
            <Button variant="ghost" onClick={onBack}>
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
