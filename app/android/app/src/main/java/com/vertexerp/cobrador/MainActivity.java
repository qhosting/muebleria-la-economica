package com.vertexerp.cobrador;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW);
                            intent.setData(Uri.parse(url));
                            startActivity(intent);
                        } catch (Exception e) {
                            try {
                                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                                request.setMimeType(mimeType);
                                String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
                                request.setDescription("Descargando actualización de La Economica...");
                                request.setTitle(fileName);
                                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                                if (dm != null) {
                                    dm.enqueue(request);
                                    Toast.makeText(getApplicationContext(), "Descargando " + fileName, Toast.LENGTH_SHORT).show();
                                }
                            } catch (Exception ex) {
                                Toast.makeText(getApplicationContext(), "Error al descargar: " + ex.getMessage(), Toast.LENGTH_SHORT).show();
                            }
                        }
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
