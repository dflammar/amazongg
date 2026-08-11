import zipfile
import xml.etree.ElementTree as ET
import csv
import json
import os

def clean_phone(phone_str):
    if not phone_str or phone_str.lower() in ['non', 'mina', 'ahmed', 'non ', 'ahmed ', 'created not work']:
        return ''
    
    parts = []
    # Split by common delimiters like '-', '/', ',' or whitespace
    raw_parts = [phone_str]
    for delim in ['-', '/', ',']:
        new_parts = []
        for p in raw_parts:
            new_parts.extend(p.split(delim))
        raw_parts = new_parts
        
    for part in raw_parts:
        part = part.strip()
        if not part:
            continue
        # Clean non-digits
        digits = ''.join(c for c in part if c.isdigit())
        if digits:
            # If it's an Egyptian mobile number starting with 1 (usually 10 digits without leading 0)
            if digits.startswith('1') and len(digits) in [9, 10]:
                digits = '0' + digits
            parts.append(digits)
            
    return ' - '.join(parts) if parts else phone_str

def get_xlsx_data(filepath):
    with zipfile.ZipFile(filepath, 'r') as zip_ref:
        shared_strings = []
        if 'xl/sharedStrings.xml' in zip_ref.namelist():
            ss_content = zip_ref.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_content)
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for t in root.findall('.//ns:t', ns):
                # Handle text elements inside shared strings
                shared_strings.append(t.text or '')
        
        if 'xl/worksheets/sheet1.xml' in zip_ref.namelist():
            sheet_content = zip_ref.read('xl/worksheets/sheet1.xml')
            root = ET.fromstring(sheet_content)
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            
            rows = []
            for row in root.findall('.//ns:row', ns):
                row_data = []
                for c in row.findall('ns:c', ns):
                    val_el = c.find('ns:v', ns)
                    val = val_el.text if val_el is not None else None
                    t = c.get('t')
                    
                    if t == 's' and val is not None:
                        val = shared_strings[int(val)]
                    row_data.append(val)
                rows.append(row_data)
            return rows
    return []

def parse_csv_cod(filepath):
    rows = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        for r in reader:
            rows.append(r)
    return rows

def main():
    extra_data = {}
    
    # Find all Total_COD files
    cod_files = []
    for f in os.listdir('.'):
        if f.startswith('Total_COD_') and (f.endswith('.csv') or f.endswith('.xlsx')):
            cod_files.append(f)
            
    if not cod_files:
        print("No Total_COD files found!")
    else:
        # Sort by file modification time to get the absolute newest file
        cod_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        newest_file = cod_files[0]
        print(f"Newest cash file detected: {newest_file}")
        
        rows = []
        is_csv = newest_file.endswith('.csv')
        if is_csv:
            try:
                rows = parse_csv_cod(newest_file)
            except UnicodeDecodeError:
                # Retry with cp1256 if utf-8 fails
                with open(newest_file, 'r', encoding='cp1256') as f:
                    reader = csv.reader(f)
                    rows = [r for r in reader]
        else:
            rows = get_xlsx_data(newest_file)
            
        if rows:
            headers = rows[0]
            # Headers: ['Station Code', 'STORE NAME', 'Store ID', 'Total COD Shipments Amount', 'Due Amount', 'Unreconciled %', ...]
            for r in rows[1:]:
                if len(r) >= 5:
                    store_id = r[2]
                    if store_id:
                        store_id = str(store_id).strip()
                        if '.' in store_id:
                            store_id = store_id.split('.')[0]
                        
                        try:
                            total_cod = float(r[3]) if r[3] else 0.0
                        except ValueError:
                            total_cod = 0.0
                            
                        try:
                            due_amount = float(r[4]) if r[4] else 0.0
                        except ValueError:
                            due_amount = 0.0
                            
                        try:
                            unreconciled = float(r[5]) if r[5] else 0.0
                            # Convert decimal representation to percentage if it's less than 1.0 (sometimes represented as 0.22 instead of 22)
                            # E.g. in XLSX it was 0.22175 -> becomes 22.18%
                            # In the new CSV it is 0.22175 -> becomes 22.18%
                            # But if it's already a high number or percentage format, leave it
                            if unreconciled < 1.0 and unreconciled > 0.0:
                                unreconciled = unreconciled * 100
                        except ValueError:
                            unreconciled = 0.0
                            
                        extra_data[store_id] = {
                            'totalCod': total_cod,
                            'dueAmount': due_amount,
                            'unreconciledPercent': round(unreconciled, 2)
                        }
    
    # 2. Parse CSV file (Phones and Max Capacity)
    csv_file = 'raghda.csv'
    if os.path.exists(csv_file):
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for r in reader:
                if len(r) >= 3:
                    store_id = r[0].strip()
                    phone_raw = r[2].strip()
                    cleaned_phone = clean_phone(phone_raw)
                    
                    max_capacity = 0
                    if len(r) >= 4:
                        try:
                            max_capacity = int(r[3].strip())
                        except ValueError:
                            pass
                            
                    if store_id not in extra_data:
                        extra_data[store_id] = {
                            'totalCod': 0.0,
                            'dueAmount': 0.0,
                            'unreconciledPercent': 0.0
                        }
                    
                    extra_data[store_id]['phone'] = cleaned_phone
                    if max_capacity > 0:
                        extra_data[store_id]['maxCapacity'] = max_capacity
                        
    # 3. Write out merged JSON data
    output_file = 'store_extra_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(extra_data, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully wrote {len(extra_data)} records to {output_file}")

if __name__ == '__main__':
    main()
