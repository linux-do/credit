
import base64
import json
import secrets
import urllib.parse
import uuid

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from dataclasses import dataclass

from flask import Flask, render_template_string, request, redirect, url_for, session

app = Flask(__name__)
# For session management
app.secret_key = secrets.token_hex(16)

# From: https://github.com/discourse/discourse/blob/main/app/models/user_api_key_scope.rb
ALL_SCOPES = [
    'read',
    'write',
    'message_bus',
    'push',
    'one_time_password',
    'notifications',
    'session_info',
    'bookmarks_calendar',
    'user_status',
]
DEFAULT_SCOPES = ['read']


@dataclass
class UserApiKeyPayload:
    key: str
    nonce: str
    push: bool
    api: int


@dataclass
class UserApiKeyRequestResult:
    client_id: str
    payload: UserApiKeyPayload


# HTML template for the web interface (improved with Chinese language and mobile-friendly design)
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discourse API Key Generator</title>
    <style>
        :root {
            --primary-color: #3498db;
            --secondary-color: #2980b9;
            --success-color: #2ecc71;
            --bg-color: #f8f9fa;
            --text-color: #333;
            --border-color: #ddd;
            --card-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            padding: 16px;
            max-width: 100%;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: var(--card-shadow);
            padding: 24px;
            margin: 16px auto;
            max-width: 600px;
        }
        
        h1 {
            color: var(--primary-color);
            font-size: 1.8rem;
            margin-bottom: 20px;
            text-align: center;
        }
        
        h2 {
            font-size: 1.4rem;
            margin-bottom: 16px;
            color: var(--secondary-color);
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #555;
        }

        .form-note {
            font-size: 0.85rem;
            color: #e74c3c;
            margin-top: -4px;
            margin-bottom: 12px;
            display: block;
        }
        
        input[type="text"], textarea {
            width: 100%;
            padding: 12px;
            margin-bottom: 16px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 16px;
        }
        
        .scopes-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        
        @media (min-width: 500px) {
            .scopes-container {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        
        .scope-item {
            display: flex;
            align-items: center;
            padding: 6px 0;
        }
        
        .scope-item input[type="checkbox"] {
            margin-right: 8px;
            width: 18px;
            height: 18px;
        }
        
        button {
            background-color: var(--primary-color);
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            transition: background-color 0.2s;
        }
        
        button:hover {
            background-color: var(--secondary-color);
        }
        
        .result {
            background-color: #f1f8ff;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid #d1e9ff;
        }
        
        .api-key {
            font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background-color: #edf2f7;
            padding: 12px;
            border-radius: 8px;
            word-break: break-all;
            margin-top: 8px;
            border: 1px solid #e2e8f0;
            font-size: 14px;
        }
        
        ol, ul {
            padding-left: 24px;
            margin-bottom: 16px;
        }
        
        li {
            margin-bottom: 8px;
        }
        
        a {
            color: var(--primary-color);
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .back-link {
            display: block;
            text-align: center;
            margin-top: 24px;
        }
        
        .copy-btn {
            background-color: #f1f1f1;
            color: #333;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 6px 12px;
            margin-top: 8px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .copy-btn:hover {
            background-color: #e1e1e1;
        }
        
        .success-msg {
            display: none;
            color: var(--success-color);
            margin-top: 6px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Discourse API Key Generator</h1>
        
        {% if step == "generate" %}
        <form method="post" action="{{ url_for('generate_key') }}">
            <div>
                <label for="site_url">Site URL:</label>
                <input type="text" id="site_url" name="site_url" value="https://linux.do" required>
            </div>
            
            <div>
                <label for="application_name">Application Name:</label>
                <input type="text" id="application_name" name="application_name" value="Sample Discourse App" required>
            </div>
            
            <div>
                <label for="client_id">Client ID (optional):</label>
                <input type="text" id="client_id" name="client_id" placeholder="Leave blank to auto-generate">
            </div>
            
            <div>
                <label>Scopes:</label>
                <small class="form-note">Only read scopes are allowed</small>
                <div class="scopes-container">
                    {% for scope in all_scopes %}
                    <div class="scope-item">
                        <input type="checkbox" id="scope_{{ scope }}" name="scopes" value="{{ scope }}" 
                            {% if scope in default_scopes %}checked{% endif %}>
                        <label for="scope_{{ scope }}">{{ scope }}</label>
                    </div>
                    {% endfor %}
                </div>
            </div>
            
            <button type="submit">Generate API Key</button>
        </form>
        
        {% elif step == "auth_url" %}
        <h2>Authorization Steps</h2>
        <p>Please complete the following steps:</p>
        <ol>
            <li>Click the link below to open the Discourse authorization page</li>
            <li>Log in to your Discourse account if necessary</li>
            <li>Authorize the application</li>
            <li>Copy the encrypted payload from the authorization page</li>
            <li>Paste it into the form below</li>
        </ol>
        
        <a href="{{ auth_url }}" target="_blank" class="auth-link">
            <button style="margin-bottom: 20px">Open Discourse Authorization Page</button>
        </a>
        
        <form method="post" action="{{ url_for('decrypt_payload') }}">
            <div>
                <label for="encrypted_payload">Encrypted Payload:</label>
                <textarea id="encrypted_payload" name="encrypted_payload" rows="5" required></textarea>
            </div>
            
            <button type="submit">Decrypt and Get API Key</button>
        </form>
        
        {% elif step == "result" %}
        <h2>Your API Key</h2>
        <div class="result">
            <p><strong>Client ID:</strong> {{ result.client_id }}</p>
            <div id="key-container">
                <p><strong>API Key:</strong></p>
                <div class="api-key" id="api-key">{{ result.payload.key }}</div>
                <button class="copy-btn" onclick="copyApiKey()">Copy API Key</button>
                <span class="success-msg" id="copy-success">Copied!</span>
            </div>
        </div>
        
        <a href="{{ url_for('index') }}" class="back-link">Generate Another Key</a>
        
        <script>
            function copyApiKey() {
                const keyText = document.getElementById('api-key').innerText;
                navigator.clipboard.writeText(keyText).then(() => {
                    const successMsg = document.getElementById('copy-success');
                    successMsg.style.display = 'block';
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                    }, 2000);
                });
            }
        </script>
        {% endif %}
    </div>
</body>
</html>
'''


@app.route('/')
def index():
    return render_template_string(
        HTML_TEMPLATE,
        step="generate",
        all_scopes=ALL_SCOPES,
        default_scopes=DEFAULT_SCOPES
    )


@app.route('/generate', methods=['POST'])
def generate_key():
    # Get form data
    site_url_base = request.form.get('site_url', 'https://linux.do')
    application_name = request.form.get('application_name', 'Sample Discourse App')
    client_id = request.form.get('client_id', '')
    scopes = request.form.getlist('scopes') or DEFAULT_SCOPES
    
    # Validate scopes
    if not set(scopes) <= set(ALL_SCOPES):
        return "Invalid scopes", 400
    
    # Generate RSA key pair
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=4096,
    )
    public_key = private_key.public_key()
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode('ascii')
    
    # Generate a random client ID if not provided
    client_id_to_use = str(uuid.uuid4()) if not client_id else client_id
    nonce = secrets.token_urlsafe(32)
    
    # Store private key in session for later decryption
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('ascii')
    
    session['private_key_pem'] = private_key_pem
    session['client_id'] = client_id_to_use
    session['nonce'] = nonce
    
    # Build authorization URL
    params_dict = {
        'application_name': application_name,
        'client_id': client_id_to_use,
        'scopes': ','.join(scopes),
        'public_key': public_key_pem,
        'nonce': nonce,
    }
    params_str = '&'.join(f'{k}={urllib.parse.quote(v)}' for k, v in params_dict.items())
    auth_url = f'{site_url_base}/user-api-key/new?{params_str}'
    
    return render_template_string(
        HTML_TEMPLATE,
        step="auth_url",
        auth_url=auth_url
    )


@app.route('/decrypt', methods=['POST'])
def decrypt_payload():
    if 'private_key_pem' not in session or 'client_id' not in session or 'nonce' not in session:
        return redirect(url_for('index'))
    
    # Get encrypted payload from form
    enc_payload = request.form.get('encrypted_payload', '')
    if not enc_payload:
        return "Encrypted payload not provided", 400
    
    # Load private key from session
    private_key = serialization.load_pem_private_key(
        session['private_key_pem'].encode('ascii'),
        password=None
    )
    
    # Decrypt payload
    try:
        dec_payload_json = private_key.decrypt(
            base64.b64decode(enc_payload),
            padding.PKCS1v15(),
        )
        dec_payload_data = json.loads(dec_payload_json)
        dec_payload = UserApiKeyPayload(**dec_payload_data)
        
        # Verify nonce
        if dec_payload.nonce != session['nonce']:
            return "Nonce does not match - security verification failed", 400
        
        # Create result object
        result = UserApiKeyRequestResult(
            client_id=session['client_id'],
            payload=dec_payload
        )
        
        # Clear sensitive data from session
        session.pop('private_key_pem', None)
        session.pop('nonce', None)
        
        return render_template_string(
            HTML_TEMPLATE,
            step="result",
            result=result
        )
    except Exception as e:
        return f"Error decrypting payload: {str(e)}", 400


if __name__ == '__main__':
    # for development only
    app.run(debug=True, host='::', port=5000)
