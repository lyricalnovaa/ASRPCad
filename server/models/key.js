const rolePermissionMapping = {
    'Police Officer': 'police.update_status,police.lookup_plate',
    'Police Supervisor': 'police.supervisor,police.update_status,police.lookup_plate,admin.manage_units',
    'Dispatch': 'dispatch.create_call,dispatch.assign_unit',
    'Dispatch Supervisor': 'dispatch.supervisor,dispatch.create_call,dispatch.assign_unit,admin.manage_calls',
    'Fire/EMS': 'ems.respond_call,ems.add_patient_notes',
    'Fire Captain': 'fire.captain,ems.respond_call,ems.add_patient_notes,admin.manage_units',
    'Civilian': 'civilian.create_character',
    'DOT': 'dot.control_traffic',
    'Admin': 'admin.full_access'
};

module.exports = {
    rolePermissionMapping
};
