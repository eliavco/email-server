module.exports = process => {
    return {
        type: process.env.GCLOUD_CREDENTIALS_type,
        project_id: process.env.GCLOUD_CREDENTIALS_project_id,
        private_key_id: process.env.GCLOUD_CREDENTIALS_private_key_id,
        private_key: process.env.GCLOUD_CREDENTIALS_private_key.replace(
            /\\n/gm,
            '\n'
        ),
        client_email: process.env.GCLOUD_CREDENTIALS_client_email,
        client_id: process.env.GCLOUD_CREDENTIALS_client_id,
        auth_uri: process.env.GCLOUD_CREDENTIALS_auth_uri,
        token_uri: process.env.GCLOUD_CREDENTIALS_token_uri,
        auth_provider_x509_cert_url:
            process.env.GCLOUD_CREDENTIALS_auth_provider_x509_cert_url,
        client_x509_cert_url:
            process.env.GCLOUD_CREDENTIALS_client_x509_cert_url
    };
};
