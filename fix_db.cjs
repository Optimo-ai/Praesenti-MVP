const fs = require('fs');

try {
  let text = fs.readFileSync('index.html', 'utf8');

  // 1. Wizard definition
  text = text.replace(
      'const Wizard = ({ open, onClose, prefill, onComplete }) => {', 
      'const Wizard = ({ open, onClose, prefill, onComplete, user }) => {'
  );

  // 2. Wizard next function
  const oldNext = 'const next = () => {\r\n    if (step === 5) {\r\n      if (!cons.c1 || !cons.c2) {\r\n        setCErr(true);\r\n        return;\r\n      }\r\n      setSubmitted(true);\r\n      setStep(6);\r\n      setTimeout(() => {\r\n        setStep(1);';
  
  const newNext = `const next = async () => {
    if (step === 5) {
      if (!cons.c1 || !cons.c2) {
        setCErr(true);
        return;
      }
      setSubmitted(true);
      if (user && user.id) {
        try {
            const pacRes = await fetch(SUPA_URL + '/rest/v1/paciente?auth_user_id=eq.' + user.id + '&select=paciente_id', {
                headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
            }).then(r => r.json());
            if (pacRes && pacRes[0]) {
                const pid = pacRes[0].paciente_id;
                await fetch(SUPA_URL + '/rest/v1/caso', {
                    method: "POST",
                    headers: { "Content-Type": "application/json", apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Prefer": "return=minimal" },
                    body: JSON.stringify({ paciente_id: pid, estado: "lead", procedimiento: proc || "TBD" })
                });
                await fetch(SUPA_URL + '/rest/v1/perfil_medico', {
                    method: "POST",
                    headers: { "Content-Type": "application/json", apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Prefer": "return=minimal" },
                    body: JSON.stringify({ paciente_id: pid, procedimiento_interes: proc, presupuesto_estimado_usd: budget })
                });
            }
        } catch(e) { console.error("Error guardando en Supabase:", e); }
      }
      setStep(6);
      setTimeout(() => {
        setStep(1);`;

  // Apply replacement for next()
  text = text.replace(oldNext, newNext);
  text = text.replace(oldNext.replace(/\r\n/g, '\n'), newNext);

  // 3. DashWiz component invocation in PatientDashboard
  const oldDash = '/* @__PURE__ */ React.createElement(Wizard, { open: dashWizOpen, prefill: { fn: firstName, ln: lastName, email: (user == null ? void 0 : user.email) || "" }, onClose: () => setDashWizOpen(false), onComplete: () => setDashWizOpen(false) })';
  const newDash = '/* @__PURE__ */ React.createElement(Wizard, { open: dashWizOpen, user: user, prefill: { fn: firstName, ln: lastName, email: (user == null ? void 0 : user.email) || "" }, onClose: () => setDashWizOpen(false), onComplete: () => setDashWizOpen(false) })';
  text = text.replace(oldDash, newDash);

  // 4. Update setUser to include ID
  const oldSetUser = 'setUser({ fn: meta.fn || "", ln: meta.ln || "", email: data.email });';
  const newSetUser = 'setUser({ id: data.id, fn: meta.fn || "", ln: meta.ln || "", email: data.email });';
  text = text.replace(oldSetUser, newSetUser);

  // 5. Connect sharedCases to Supabase in App
  const oldState = 'const [sharedCases, setSharedCases] = useState(MOCK_CASES);\n  const [sharedNotes, setSharedNotes] = useState(MOCK_NOTES);';
  const oldStateCRLF = 'const [sharedCases, setSharedCases] = useState(MOCK_CASES);\r\n  const [sharedNotes, setSharedNotes] = useState(MOCK_NOTES);';
  
  const newState = `const [sharedCases, setSharedCases] = useState([]);
  const [sharedNotes, setSharedNotes] = useState(MOCK_NOTES);

  useEffect(() => {
    if ((view === "admin" || view === "coordinator") && user) {
      fetch(SUPA_URL + '/rest/v1/caso?select=*,paciente(*)', {
        headers: { apikey: SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
      })
      .then(r => r.json())
      .then(data => {
          if (data && !data.error) {
            const mapped = data.map(dbCase => ({
              id: "CS-" + dbCase.caso_id.substring(0,5).toUpperCase(),
              name: (dbCase.paciente && dbCase.paciente.nombre_completo) ? dbCase.paciente.nombre_completo : "Paciente Anónimo",
              proc: dbCase.procedimiento || "TBD",
              surgeon: dbCase.coordinador_asignado || "TBD",
              budget: "TBD",
              country: (dbCase.paciente && dbCase.paciente.pais_residencia) ? dbCase.paciente.pais_residencia : "DO",
              date: dbCase.fecha_creacion ? dbCase.fecha_creacion.substring(0,10) : "TBD",
              status: dbCase.estado.charAt(0).toUpperCase() + dbCase.estado.slice(1).replace("_", " "),
              rating: "N/A",
              notes: []
            }));
            // Si hay casos reales en DB los ponemos, sino el fallback MOCK para el UI layout
            setSharedCases(mapped.length > 0 ? mapped : MOCK_CASES);
          }
      })
      .catch(e => console.error("Error cargando casos:", e));
    }
  }, [view, user]);`;

  text = text.replace(oldStateCRLF, newState.replace(/\n/g, '\r\n'));
  text = text.replace(oldState, newState);

  fs.writeFileSync('index.html', text);
  console.log('Todos los reemplazos fueron realizados exitosamente en index.html');

} catch(err) {
  console.error("Error", err);
}
