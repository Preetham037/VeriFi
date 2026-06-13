import os
import json
import nbformat as nbf
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Ensure directories exist
os.makedirs('notebooks', exist_ok=True)
os.makedirs('backend', exist_ok=True)
os.makedirs('data', exist_ok=True)

# ----------------------------------------------------
# 1. Generate Synthetic Data
# ----------------------------------------------------
print("Generating synthetic data...")
np.random.seed(42)
n_samples = 5000

# Features:
# amt: amount in USD
# distance: distance from home in miles
# txn_velocity: number of transactions in last 24h
# age: age of cardholder
# hour: hour of transaction (0-23)
# is_online: 0 or 1
# is_international: 0 or 1
# card_present: 0 or 1

amt = np.random.exponential(scale=60, size=n_samples) + 10
distance = np.random.exponential(scale=15, size=n_samples) + 0.2
txn_velocity = np.random.poisson(lam=2, size=n_samples) + 1
age = np.random.normal(loc=45, scale=15, size=n_samples).astype(int)
age = np.clip(age, 18, 90)
hour = np.random.choice(range(24), size=n_samples)
is_online = np.random.binomial(n=1, p=0.6, size=n_samples)
is_international = np.random.binomial(n=1, p=0.05, size=n_samples)
card_present = np.where(is_online == 1, 0, np.random.binomial(n=1, p=0.9, size=n_samples))

# Explicitly inject fraud cases in the distributions so the model can learn them!
# We will inject 150 fraud transactions (~3% of the dataset) of different types:
for i in range(150):
    idx = np.random.randint(0, n_samples)
    fraud_type = np.random.choice([1, 2, 3, 4])
    
    if fraud_type == 1:
        # High Online Amount Fraud
        amt[idx] = np.random.uniform(900, 4500)
        is_online[idx] = 1
        card_present[idx] = 0
    elif fraud_type == 2:
        # International location mismatch
        is_international[idx] = 1
        distance[idx] = np.random.uniform(150, 950)
    elif fraud_type == 3:
        # Midnight Velocity Card testing
        hour[idx] = np.random.choice([1, 2, 3, 4])
        txn_velocity[idx] = np.random.randint(8, 15)
        is_online[idx] = 1
        card_present[idx] = 0
    elif fraud_type == 4:
        # Young account high value
        age[idx] = np.random.randint(18, 24)
        amt[idx] = np.random.uniform(450, 1500)

df = pd.DataFrame({
    'amt': amt,
    'distance': distance,
    'txn_velocity': txn_velocity,
    'age': age,
    'hour': hour,
    'is_online': is_online,
    'is_international': is_international,
    'card_present': card_present
})

# Ingest Fraud Rules
# 1. Very high amount online is likely fraud
fraud_prob = np.zeros(n_samples)
fraud_prob += np.where((df['amt'] > 800) & (df['is_online'] == 1), 0.85, 0)
# 2. International and high distance
fraud_prob += np.where((df['is_international'] == 1) & (df['distance'] > 100), 0.80, 0)
# 3. Midnight high velocity online
fraud_prob += np.where((df['hour'] < 5) & (df['txn_velocity'] > 6) & (df['is_online'] == 1), 0.75, 0)
# 4. Young cardholder with high amount
fraud_prob += np.where((df['age'] < 25) & (df['amt'] > 400), 0.60, 0)
# 5. Base fraud rate
fraud_prob += 0.005

fraud_prob = np.clip(fraud_prob, 0, 0.98)
is_fraud = np.random.binomial(n=1, p=fraud_prob)
df['is_fraud'] = is_fraud

# Save dataset
df.to_csv('data/transactions.csv', index=False)
print(f"Generated {n_samples} transactions. Fraud rate: {df['is_fraud'].mean():.2%}")

# ----------------------------------------------------
# 2. Create notebooks/Fraud_EDA.ipynb
# ----------------------------------------------------
print("Creating Fraud_EDA.ipynb...")
nb = nbf.v4.new_notebook()

nb['cells'] = [
    nbf.v4.new_markdown_cell("# Fraud Detection - Exploratory Data Analysis (EDA)\n"
                             "This notebook performs Exploratory Data Analysis on the synthetic bank transaction dataset to understand fraud distributions and patterns."),
    nbf.v4.new_code_cell("import pandas as pd\n"
                         "import numpy as np\n"
                         "\n"
                         "# Load dataset\n"
                         "df = pd.read_csv('../data/transactions.csv')\n"
                         "print('Dataset Shape:', df.shape)\n"
                         "df.head()"),
    nbf.v4.new_markdown_cell("## Class Balance\n"
                             "Let's look at the distribution of genuine vs fraudulent transactions."),
    nbf.v4.new_code_cell("class_counts = df['is_fraud'].value_counts()\n"
                         "class_pct = df['is_fraud'].value_counts(normalize=True) * 100\n"
                         "for cls, count, pct in zip(class_counts.index, class_counts, class_pct):\n"
                         "    label = 'Fraudulent' if cls == 1 else 'Genuine'\n"
                         "    print(f'{label}: {count} ({pct:.2f}%)')"),
    nbf.v4.new_markdown_cell("## Feature Analysis by Fraud Class\n"
                             "Compare mean feature values for genuine vs fraudulent transactions to identify patterns."),
    nbf.v4.new_code_cell("df.groupby('is_fraud').mean()")
]

with open('notebooks/Fraud_EDA.ipynb', 'w') as f:
    nbf.write(nb, f)

# ----------------------------------------------------
# 3. Create notebooks/Fraud_Preprocessing.ipynb
# ----------------------------------------------------
print("Creating Fraud_Preprocessing.ipynb...")
nb = nbf.v4.new_notebook()

nb['cells'] = [
    nbf.v4.new_markdown_cell("# Fraud Detection - Preprocessing and Feature Engineering\n"
                             "This notebook handles loading the raw transaction data, performing train-test splits, and preparing variables for model training."),
    nbf.v4.new_code_cell("import pandas as pd\n"
                         "from sklearn.model_selection import train_test_split\n"
                         "\n"
                         "# Load raw dataset\n"
                         "df = pd.read_csv('../data/transactions.csv')\n"
                         "\n"
                         "# Split features and labels\n"
                         "X = df.drop(columns=['is_fraud'])\n"
                         "y = df['is_fraud']\n"
                         "\n"
                         "# Train/Test Split (80% Train, 20% Test)\n"
                         "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)\n"
                         "\n"
                         "print(f'Train set shape: {X_train.shape}')\n"
                         "print(f'Test set shape: {X_test.shape}')"),
    nbf.v4.new_markdown_cell("## Save Preprocessed Splits\n"
                             "Save the splits for the training phase."),
    nbf.v4.new_code_cell("X_train.to_csv('../data/X_train.csv', index=False)\n"
                         "X_test.to_csv('../data/X_test.csv', index=False)\n"
                         "y_train.to_csv('../data/y_train.csv', index=False)\n"
                         "y_test.to_csv('../data/y_test.csv', index=False)\n"
                         "print('Preprocessed splits saved successfully!')")
]

with open('notebooks/Fraud_Preprocessing.ipynb', 'w') as f:
    nbf.write(nb, f)

# ----------------------------------------------------
# 4. Create notebooks/Fraud_Model_Training.ipynb
# ----------------------------------------------------
print("Creating Fraud_Model_Training.ipynb and training model...")
nb = nbf.v4.new_notebook()

nb['cells'] = [
    nbf.v4.new_markdown_cell("# Fraud Detection - Model Training\n"
                             "This notebook trains a Random Forest Classifier to detect fraudulent transactions and evaluates its performance."),
    nbf.v4.new_code_cell("import pandas as pd\n"
                         "import numpy as np\n"
                         "from sklearn.ensemble import RandomForestClassifier\n"
                         "from sklearn.metrics import classification_report, accuracy_score, roc_auc_score\n"
                         "import joblib\n"
                         "\n"
                         "# Load training and testing data\n"
                         "X_train = pd.read_csv('../data/X_train.csv')\n"
                         "X_test = pd.read_csv('../data/X_test.csv')\n"
                         "y_train = pd.read_csv('../data/y_train.csv').values.ravel()\n"
                         "y_test = pd.read_csv('../data/y_test.csv').values.ravel()"),
    nbf.v4.new_markdown_cell("## Model Training\n"
                             "Train a Random Forest Classifier on our training features."),
    nbf.v4.new_code_cell("model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')\n"
                         "model.fit(X_train, y_train)\n"
                         "print('Model trained successfully!')"),
    nbf.v4.new_markdown_cell("## Evaluation\n"
                             "Evaluate the model performance on the test set."),
    nbf.v4.new_code_cell("y_pred = model.predict(X_test)\n"
                         "y_prob = model.predict_proba(X_test)[:, 1]\n"
                         "\n"
                         "print(f'Accuracy: {accuracy_score(y_test, y_pred):.4f}')\n"
                         "print(f'ROC AUC: {roc_auc_score(y_test, y_prob):.4f}')\n"
                         "print('\\nClassification Report:\\n', classification_report(y_test, y_pred))"),
    nbf.v4.new_markdown_cell("## Feature Importance\n"
                             "Retrieve the feature importances to see which factors contribute most to fraud detection."),
    nbf.v4.new_code_cell("importances = model.feature_importances_\n"
                         "indices = np.argsort(importances)[::-1]\n"
                         "for rank, idx in enumerate(indices):\n"
                         "    print(f'{rank+1}. {X_train.columns[idx]}: {importances[idx]:.4f}')"),
    nbf.v4.new_markdown_cell("## Save Model\n"
                             "Persist the model file for deployment in the backend API."),
    nbf.v4.new_code_cell("joblib.dump(model, '../backend/fraud_model.pkl')\n"
                         "print('Saved model to backend/fraud_model.pkl')")
]

with open('notebooks/Fraud_Model_Training.ipynb', 'w') as f:
    nbf.write(nb, f)

# ----------------------------------------------------
# 5. Create notebooks/Fraud_Risk_Engine.ipynb
# ----------------------------------------------------
print("Creating Fraud_Risk_Engine.ipynb...")
nb = nbf.v4.new_notebook()

nb['cells'] = [
    nbf.v4.new_markdown_cell("# Fraud Detection - Explainable Risk Engine\n"
                             "This notebook details how the real-time Risk Engine integrates the Random Forest model and uses SHAP values to explain individual transaction risk scores."),
    nbf.v4.new_code_cell("import pandas as pd\n"
                         "import joblib\n"
                         "import shap\n"
                         "\n"
                         "# Load model and validation features\n"
                         "model = joblib.load('../backend/fraud_model.pkl')\n"
                         "X_test = pd.read_csv('../data/X_test.csv')\n"
                         "\n"
                         "# Set up SHAP TreeExplainer\n"
                         "explainer = shap.TreeExplainer(model)\n"
                         "print('SHAP Explainer loaded.')"),
    nbf.v4.new_markdown_cell("## Compute SHAP for a Single Transaction\n"
                             "Select a transaction, calculate its risk score, and compute the SHAP values (feature contributions) that explain the prediction."),
    nbf.v4.new_code_cell("txn = X_test.iloc[0:1]\n"
                         "prob = model.predict_proba(txn)[0, 1]\n"
                         "shap_values = explainer.shap_values(txn)\n"
                         "\n"
                         "print('Transaction features:\\n', txn.to_dict(orient='records')[0])\n"
                         "print(f'Predicted Risk Score: {prob:.2%}')\n"
                         "print('SHAP Values (Class 1 - Fraud):\\n', dict(zip(X_test.columns, shap_values[0][:, 1] if isinstance(shap_values, list) else (shap_values[0] if len(shap_values.shape) > 1 else shap_values))))")
]

with open('notebooks/Fraud_Risk_Engine.ipynb', 'w') as f:
    nbf.write(nb, f)

# ----------------------------------------------------
# Run Training and Preprocessing scripts to train model and save it
# ----------------------------------------------------
print("Training the real Random Forest model...")
X = df.drop(columns=['is_fraud'])
y = df['is_fraud']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Save intermediate csv datasets in data folder
X_train.to_csv('data/X_train.csv', index=False)
X_test.to_csv('data/X_test.csv', index=False)
y_train.to_csv('data/y_train.csv', index=False)
y_test.to_csv('data/y_test.csv', index=False)

# Train the model and save it to backend/fraud_model.pkl
model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, class_weight='balanced')
model.fit(X_train, y_train)
joblib.dump(model, 'backend/fraud_model.pkl')

print("All notebooks and model files created and trained successfully!")
