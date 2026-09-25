import numpy as np
from events.models import EventRating
import os 
from django.core.management.base import BaseCommand
from django.conf import settings
from events.models import EventRating

class Command(BaseCommand):
    def handle(self, *args, **options):
        rating= EventRating.objects.all().values("user_id", "event_id", "rating")
        
        if not rating:
            return
        
        users= list(set(rec["user_id"] for rec in rating))
        events= list(set(rec["event_id"] for rec in rating))
        
        users_map= {}
        i= 0 
        for id in users:
            users_map[id]= i
            i+=1
        events_map= {}
        i= 0 
        for id in events:
            events_map[id]= i
            i+=1
        dataset= [(users_map[rec["user_id"]],events_map[rec["event_id"]],rec["rating"])for rec in rating]
        
        m= sum(rec[2] for rec in dataset)/len(dataset)
        
        K=20
        epochs= 200
        myeta= 0.02
        mylamda= 0.1
        if len(dataset) < 10000:
            K= 4
            epochs= 300
            myeta= 0.01
            mylamda= 0.01
        
        b= np.zeros(len(users))
        c= np.zeros(len(events))
        V= np.random.normal(scale= 1.0/K, size= (len(users), K))
        F= np.random.normal(scale= 1.0/K, size= (len(events), K))
        
        for j in range(epochs):
            t_e= 0.0
            for u,i,rating in dataset:
                x= m + b[u] + c[i] + np.dot(V[u],F[i])
                e= rating - x 
                t_e+= e**2
                b[u]+= myeta*(e-mylamda*b[u])
                c[i]+= myeta*(e-mylamda*c[i])
                Temp_V = myeta*(e*F[i] - mylamda*V[u]) + V[u]
                F[i]  += myeta*(e*V[u] - mylamda*F[i])
                V[u] = Temp_V
            RMSE= np.sqrt(t_e/len(dataset))
            print(f"Epoch {j} RMSE: {RMSE}")
            
        dir = os.path.join(settings.BASE_DIR, "Recommendation_Vec") 
        os.makedirs(dir, exist_ok=True)
        path= os.path.join(dir, "Recommendation_Vec.npz")
        np.savez_compressed(path,V=V,F=F,b=b,c=c,m=m,users_map=users_map,events_map=events_map)
        print("finished\n")
        