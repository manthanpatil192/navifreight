import urllib.request
import json

req = urllib.request.Request(
    'https://api.github.com/repos/manthanpatil192/navifreight/actions/runs?per_page=5',
    headers={'User-Agent': 'Mozilla/5.0'}
)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for run in data.get('workflow_runs', []):
            print(f"Run ID: {run['id']}, Status: {run['status']}, Conclusion: {run['conclusion']}, Commit: {run['head_sha'][:7]}, URL: {run['html_url']}")
            
            # Fetch jobs for this run
            jobs_req = urllib.request.Request(run['jobs_url'], headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(jobs_req) as jobs_resp:
                jobs_data = json.loads(jobs_resp.read().decode())
                for job in jobs_data.get('jobs', []):
                    print(f"  Job: {job['name']}, Conclusion: {job['conclusion']}")
                    for step in job.get('steps', []):
                        if step['conclusion'] == 'failure':
                            print(f"    FAILED STEP: {step['name']} (Conclusion: {step['conclusion']})")
except Exception as e:
    print("Error:", e)
