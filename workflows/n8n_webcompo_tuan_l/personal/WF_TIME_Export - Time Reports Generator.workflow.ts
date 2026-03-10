import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : WF_TIME_Export - Time Reports Generator
// Nodes   : 5  |  Connections: 4
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ExportTimeReportWebhook            webhook                    
// ParseRequest                       code                       
// GetTimeSessions                    notion                     
// GenerateTimeReport                 code                       
// WebhookResponse                    respondToWebhook           
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ExportTimeReportWebhook
//    → ParseRequest
//      → GetTimeSessions
//        → GenerateTimeReport
//          → WebhookResponse
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "00RPFCxLfkJgXGGB",
    name: "WF_TIME_Export - Time Reports Generator",
    active: false,
    settings: { executionOrder: "v1" }
})
export class WfTimeExportTimeReportsGeneratorWorkflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        id: "af514462-c620-40e3-8e5d-1b6bc7fedf90",
        webhookId: "nova-export-time-report",
        name: "Export Time Report Webhook",
        type: "n8n-nodes-base.webhook",
        version: 2,
        position: [-224, 0]
    })
    ExportTimeReportWebhook = {
        httpMethod: "POST",
        path: "nova/export-time-report",
        responseMode: "lastNode",
        options: {}
    };

    @node({
        id: "841dc816-301f-4fbd-8221-701973e06255",
        name: "Parse Request",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [0, 0]
    })
    ParseRequest = {
        jsCode: `const body = $input.first().json.body || $input.first().json;
return {
  json: {
    student_page_id: body.student_page_id || '',
    student_name: body.student_name || '',
    email: body.email || '',
    date_from: body.date_from || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0],
    date_to: body.date_to || new Date().toISOString().split('T')[0],
    export_all: body.export_all || false
  }
};`
    };

    @node({
        id: "62d77877-97a1-4841-b601-1d2a38ad9cd3",
        name: "Get Time Sessions",
        type: "n8n-nodes-base.notion",
        version: 2.2,
        position: [224, 0]
    })
    GetTimeSessions = {
        resource: "databasePage",
        operation: "getAll",
        databaseId: "={{$env.SESSIONS_TEMPS_DB_ID}}",
        returnAll: true,
        filterType: "manual",
        matchType: "allFilters",
        filters: {
            conditions: [
                {
                    key: "Date début",
                    condition: "onOrAfter",
                    returnType: "date"
                }
            ]
        },
        options: {}
    };

    @node({
        id: "8e6ef277-f517-4684-8131-b834484452a9",
        name: "Generate Time Report",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [448, 0]
    })
    GenerateTimeReport = {
        jsCode: `const sessions = $input.all();
const studentName = $('Parse Request').item.json.student_name;
const dateFrom = $('Parse Request').item.json.date_from;
const dateTo = $('Parse Request').item.json.date_to;

let totalMinutes = 0;
let dayBreakdown = {};
let moduleBreakdown = {};

sessions.forEach(s => {
  const props = s.json.properties || {};
  const duration = props['Durée (min)']?.number || 0;
  const date = props['Date début']?.date?.start?.split('T')[0] || '';
  const module = props['Module']?.rich_text?.[0]?.plain_text || 'Autre';

  totalMinutes += duration;
  dayBreakdown[date] = (dayBreakdown[date] || 0) + duration;
  moduleBreakdown[module] = (moduleBreakdown[module] || 0) + duration;
});

const hours = Math.floor(totalMinutes / 60);
const mins = totalMinutes % 60;

let report = \`# Rapport de Temps - \${studentName}\\n\`;
report += \`Période: \${dateFrom} → \${dateTo}\\n\\n\`;
report += \`## Résumé\\n\`;
report += \`- **Temps total:** \${hours}h \${mins}min (\${totalMinutes} minutes)\\n\`;
report += \`- **Sessions:** \${sessions.length}\\n\`;
report += \`- **Moyenne/jour:** \${Object.keys(dayBreakdown).length > 0 ? Math.round(totalMinutes / Object.keys(dayBreakdown).length) : 0} min\\n\\n\`;
report += \`## Détail par jour\\n\\n| Date | Durée |\\n|---|---|\\n\`;
Object.entries(dayBreakdown).sort().forEach(([date, mins]) => {
  report += \`| \${date} | \${Math.floor(mins/60)}h\${mins%60}min |\\n\`;
});
report += \`\\n## Détail par module\\n\\n| Module | Durée |\\n|---|---|\\n\`;
Object.entries(moduleBreakdown).forEach(([mod, mins]) => {
  report += \`| \${mod} | \${Math.floor(mins/60)}h\${mins%60}min |\\n\`;
});

return {
  json: {
    report,
    total_minutes: totalMinutes,
    total_hours: \`\${hours}h\${mins}min\`,
    session_count: sessions.length,
    days_active: Object.keys(dayBreakdown).length
  }
};`
    };

    @node({
        id: "6663995c-7e90-45b8-968a-bbaa45329291",
        name: "Webhook Response",
        type: "n8n-nodes-base.respondToWebhook",
        version: 1,
        position: [656, 0]
    })
    WebhookResponse = {
        respondWith: "json",
        responseBody: `={
  "success": true,
  "total_hours": "{{$json.total_hours}}",
  "sessions": {{$json.session_count}},
  "days_active": {{$json.days_active}},
  "report": "Generated"
}`,
        options: {
            responseCode: 200
        }
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.ExportTimeReportWebhook.out(0).to(this.ParseRequest.in(0));
        this.ParseRequest.out(0).to(this.GetTimeSessions.in(0));
        this.GetTimeSessions.out(0).to(this.GenerateTimeReport.in(0));
        this.GenerateTimeReport.out(0).to(this.WebhookResponse.in(0));
    }
}